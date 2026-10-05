-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

-- Stores the real, shared closing time for each auction lot, so the
-- countdown on the Auction page is one fixed deadline for everyone
-- instead of a per-browser timer that resets on refresh.
create table if not exists public.lots (
  id text primary key,
  closes_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.lots enable row level security;

drop policy if exists "Lots are viewable by everyone" on public.lots;
create policy "Lots are viewable by everyone"
  on public.lots for select
  using (true);

-- Seeds the current lot with a close time 6 hours from whenever this
-- migration is first run. `on conflict do nothing` means re-running this
-- script later won't push the deadline back out.
insert into public.lots (id, closes_at)
values ('lot-042', now() + interval '6 hours')
on conflict (id) do nothing;
