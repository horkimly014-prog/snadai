-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Changes lot-042's cadence to 1 hour of bidding, then a 15-minute break
-- before the next round opens automatically — the schema and pg_cron job
-- from 0004/0005 are unchanged, this just updates the two values they read.
-- Takes effect starting with the lot's NEXT restart; the round currently in
-- progress keeps its existing closes_at until it naturally closes.

update public.lots
  set round_duration = interval '1 hour',
      restart_gap = interval '15 minutes'
  where id = 'lot-042';
