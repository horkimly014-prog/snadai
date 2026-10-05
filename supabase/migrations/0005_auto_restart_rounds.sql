-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Moves round-restarting off the "someone has to visit AuctionResults.jsx"
-- lazy trigger from 0004 and onto a real schedule: lot-042 bids for
-- round_duration (30 min), then restart_gap (1 hour) after it closes, a
-- cron job automatically reopens a fresh round — whether or not the
-- previous round actually sold. This is safe because restart_gap (1h) is
-- always much longer than the full payment cascade (3 bidders x the 5-min
-- window from get_lot_winner = 15 min max), so by the time the scheduled
-- restart fires, any legitimate sale has already fully resolved.

-- Enable pg_cron. On Supabase this can usually run directly from the SQL
-- Editor; if it errors with a permissions message, enable "pg_cron" first
-- under Dashboard -> Database -> Extensions, then re-run this file.
create extension if not exists pg_cron;

-- How long to wait after a round closes before automatically opening the
-- next one.
alter table public.lots
  add column if not exists restart_gap interval not null default interval '1 hour';

update public.lots
  set round_duration = interval '30 minutes',
      restart_gap = interval '1 hour'
  where id = 'lot-042';

-- get_lot_winner (0004) is read-only again: it now ONLY resolves who
-- currently holds the right to buy the lot in the CURRENT round, with no
-- side effects. Restarting a round is exclusively advance_lot_round's job
-- below, run on a fixed schedule instead of "whoever happens to load the
-- Results page after the 3rd bidder misses their window."
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
  select id, closes_at, round
    into v_lot
    from public.lots
    where id = p_lot_id;

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

-- Unconditionally reopens a lot for a fresh round once restart_gap has
-- elapsed since it closed. Runs as security definer via cron (not RLS'd
-- through any user session), same trust level as check_bid_amount/
-- get_lot_winner above.
create or replace function public.advance_lot_round(p_lot_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lots
    set round = round + 1,
        closes_at = now() + round_duration
    where id = p_lot_id
      and closes_at + restart_gap <= now();
end;
$$;

grant execute on function public.advance_lot_round(text) to postgres;

-- Checks every minute whether lot-042's gap has elapsed; advance_lot_round
-- itself is a no-op (0 rows updated) whenever it hasn't, so running this
-- often is cheap and just a matter of how quickly a restart is noticed.
select cron.unschedule(jobid)
  from cron.job
  where jobname = 'advance-lot-042';

select cron.schedule(
  'advance-lot-042',
  '* * * * *',
  $$select public.advance_lot_round('lot-042')$$
);
