-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Widens delivery_status (0006) from 3 stages to the 5-stage tracker shown
-- on the Orders page: Confirmed -> Processing -> Shipping -> Out for
-- Delivery -> Delivered. Purely additive: existing 'processing', 'shipped'
-- and 'delivered' values keep meaning exactly what they did before, so no
-- data needs to change — this just adds 'confirmed' and 'out_for_delivery'
-- as valid values and makes new orders start at 'confirmed' instead of
-- jumping straight to 'processing'.

alter table public.orders
  drop constraint if exists orders_delivery_status_check;

alter table public.orders
  add constraint orders_delivery_status_check
  check (delivery_status in ('confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'));

alter table public.orders
  alter column delivery_status set default 'confirmed';
