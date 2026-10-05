-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Fixes a bug in get_lot_winner (0004/0005): `returns table (..., round int, ...)`
-- implicitly declares a PL/pgSQL variable named `round` for the whole
-- function body. The very first query, `select id, closes_at, round ...`,
-- referenced `round` unqualified, which Postgres can't tell apart from that
-- output variable — hence "column reference \"round\" is ambiguous". Every
-- other reference in the function was already alias-qualified (b.round,
-- v_lot.round, etc.), so this was the only spot; fixed by qualifying it too.

create or replace function public.get_lot_winner(p_lot_id text)
returns table (
  bid_id uuid,
  user_id uuid,
  bidder_name text,
  amount numeric,
  rank int,
  round int,
  pay_by timestamptz,
  paid boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_window constant interval := interval '5 minutes';
  max_attempts constant int := 3;
  v_lot record;
  v_bid record;
  v_rank int := 0;
  v_deadline timestamptz;
  v_paid boolean;
begin
  select l.id, l.closes_at, l.round
    into v_lot
    from public.lots l
    where l.id = p_lot_id;

  if not found or v_lot.closes_at > now() then
    return; -- unknown lot, or still open: no winner to resolve yet
  end if;

  for v_bid in
    select b.id, b.user_id, b.bidder_name, b.amount
    from public.bids b
    where b.lot_id = p_lot_id and b.round = v_lot.round
    order by b.amount desc, b.created_at asc
    limit max_attempts
  loop
    v_rank := v_rank + 1;
    v_deadline := v_lot.closes_at + (payment_window * v_rank);

    select exists (
      select 1 from public.orders o
      where o.user_id = v_bid.user_id
        and o.status = 'paid'
        and o.items @> jsonb_build_array(
          jsonb_build_object('id', replace(p_lot_id, 'lot-', ''), 'round', v_lot.round)
        )
    ) into v_paid;

    if v_paid then
      return query select v_bid.id, v_bid.user_id, v_bid.bidder_name, v_bid.amount, v_rank, v_lot.round, v_deadline, true;
      return;
    elsif now() < v_deadline then
      return query select v_bid.id, v_bid.user_id, v_bid.bidder_name, v_bid.amount, v_rank, v_lot.round, v_deadline, false;
      return;
    end if;
    -- unpaid and this bidder's window has passed: fall through to next-highest
  end loop;

  return; -- no active winner right now (all missed their window, or no bids)
end;
$$;

grant execute on function public.get_lot_winner(text) to authenticated, anon;
