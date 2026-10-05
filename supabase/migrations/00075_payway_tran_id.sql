-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds a short transaction id for ABA PayWay, which replaces Stripe as the
-- card payment provider (see create-payway-transaction and payway-callback
-- Edge Functions). PayWay's tran_id field is capped at 20 characters, too
-- short for orders.id (a uuid), so a separate short id is generated per
-- attempt and stored here; payway-callback looks the order back up by it.

alter table public.orders
  add column if not exists payway_tran_id text;

create unique index if not exists orders_payway_tran_id_key
  on public.orders (payway_tran_id)
  where payway_tran_id is not null;
