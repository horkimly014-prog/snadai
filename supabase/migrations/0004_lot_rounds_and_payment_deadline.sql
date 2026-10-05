-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds a payment deadline + cascading-winner system on top of the existing
-- lots/bids tables:
--   - The top bidder gets PAYMENT_WINDOW (5 min) after the lot closes to pay.
--   - If they miss it, the 2nd-highest bidder becomes the active winner with
--     their own fresh 5-minute window (closes_at + 2 * PAYMENT_WINDOW), then
--     the 3rd (closes_at + 3 * PAYMENT_WINDOW).
--   - If the 3rd also misses their window (or nobody bid at all), the lot's
--     bidding round is reset so people can bid again from scratch, running
--     for the same duration as the original round.
-- All of this is computed on read (get_lot_winner), matching this project's
-- existing "recompute from source data instead of trusting stale state"
-- pattern (see AuctionResults.jsx's DB-derived-winner effect).

-- ROUNDS ------------------------------------------------------------------
-- `round` lets a lot be reopened for bidding after a forfeited sale without
-- losing the bid history of the earlier attempt(s). `round_duration` is
-- captured once (from the original closes_at - created_at) so a restarted
-- round runs for the same length as the original auction.
alter table public.lots
  add column if not exists round int not null default 1,
  add column if not exists round_duration interval not null default interval '6 hours';

update public.lots
  set round_duration = closes_at - created_at
  where round_duration = interval '6 hours';

alter table public.bids
  add column if not exists round int not null default 1;

create index if not exists bids_lot_round_idx
  on public.bids (lot_id, round, amount desc);

-- BID VALIDATION ------------------------------------------------------------
-- Extends the existing "must beat the current highest bid" check (see
-- 0001_create_bids_table.sql) to also: scope "highest" to the bid's own
-- round (so a restarted round starts back at the lot's floor instead of
-- being pinned to a previous forfeited round's price), reject bids tagged
-- with a stale round, and reject bids placed after the round has closed.
create or replace function public.check_bid_amount()
returns trigger as $$
declare
  highest numeric;
  v_closes_at timestamptz;
  v_round int;
begin
  select closes_at, round into v_closes_at, v_round
  from public.lots
  where id = new.lot_id;

  if v_closes_at is null then
    raise exception 'Unknown lot %', new.lot_id;
  end if;

  if new.round <> v_round then
    raise exception 'This round of bidding has ended; refresh to see the current round.';
  end if;

  if now() >= v_closes_at then
    raise exception 'Bidding has closed for this lot.';
  end if;

  select max(amount) into highest
  from public.bids
  where lot_id = new.lot_id and round = new.round;

  if highest is not null and new.amount <= highest then
    raise exception 'Bid amount must be higher than the current bid (%).', highest;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- WINNER RESOLUTION -----------------------------------------------------
-- Security definer because it must read across ALL bidders' orders (to
-- check who actually paid) regardless of the caller's own RLS-scoped
-- visibility into public.orders. Matches an order back to a lot/round via
-- `items` jsonb containment: AuctionResults.jsx tags the cart item it
-- creates for a lot purchase with {id: "<lot number>", round: <n>}.
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
  select id, closes_at, round, round_duration
    into v_lot
    from public.lots
    where id = p_lot_id
    for update;

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

  -- Nobody bid, or the top 3 all missed their window unpaid: reopen a fresh
  -- round for the same duration as the original auction.
  update public.lots
    set round = round + 1,
        closes_at = now() + v_lot.round_duration
    where id = p_lot_id and round = v_lot.round;

  return; -- no active winner right now; a new round just started
end;
$$;

grant execute on function public.get_lot_winner(text) to authenticated, anon;
