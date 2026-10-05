-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Adds a simple manually-updated delivery status + tracking number to
-- orders, shown in the Purchase History section on Profile.jsx. No new
-- automation: an admin sets these fields by hand (e.g. in the Table
-- Editor) as an item actually ships, rather than integrating a real
-- carrier API. Orders stay append-only from the client (see
-- 0002_secure_orders_favorites_submissions.sql — no update policy for
-- users), so this is safe to add without touching RLS.

alter table public.orders
  add column if not exists delivery_status text not null default 'processing',
  add column if not exists carrier text,
  add column if not exists tracking_number text;

alter table public.orders
  drop constraint if exists orders_delivery_status_check;

alter table public.orders
  add constraint orders_delivery_status_check
  check (delivery_status in ('processing', 'shipped', 'delivered'));
