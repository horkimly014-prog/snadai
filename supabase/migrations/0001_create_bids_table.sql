-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  lot_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  bidder_name text not null,
  amount numeric not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists bids_lot_id_created_at_idx
  on public.bids (lot_id, created_at desc);

-- Reject bids that don't beat the current highest bid for the lot,
-- so the current price can never move backwards even under concurrent requests.
create or replace function public.check_bid_amount()
returns trigger as $$
declare
  highest numeric;
begin
  select max(amount) into highest
  from public.bids
  where lot_id = new.lot_id;

  if highest is not null and new.amount <= highest then
    raise exception 'Bid amount must be higher than the current bid (%).', highest;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists bids_check_amount on public.bids;
create trigger bids_check_amount
  before insert on public.bids
  for each row execute function public.check_bid_amount();

alter table public.bids enable row level security;

drop policy if exists "Bids are viewable by everyone" on public.bids;
create policy "Bids are viewable by everyone"
  on public.bids for select
  using (true);

drop policy if exists "Authenticated users can place bids" on public.bids;
create policy "Authenticated users can place bids"
  on public.bids for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Enable realtime updates for live bidding
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'bids'
  ) then
    alter publication supabase_realtime add table public.bids;
  end if;
end $$;
