-- Run this in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
--
-- Locks down orders, favorites, and submissions so a user can only ever
-- read/write their own rows. Mirrors the pattern already used for bids
-- in 0001_create_bids_table.sql. Safe to re-run.

-- ORDERS ----------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own orders" on public.orders;
create policy "Users can insert their own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No update/delete policy is created, so orders are append-only once
-- placed; nobody (including the owner) can edit or delete a paid order
-- through the client.

-- FAVORITES ---------------------------------------------------------------
alter table public.favorites enable row level security;

drop policy if exists "Users can view their own favorites" on public.favorites;
create policy "Users can view their own favorites"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own favorites" on public.favorites;
create policy "Users can add their own favorites"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own favorites" on public.favorites;
create policy "Users can remove their own favorites"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- SUBMISSIONS -------------------------------------------------------------
alter table public.submissions enable row level security;

drop policy if exists "Users can view their own submissions" on public.submissions;
create policy "Users can view their own submissions"
  on public.submissions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own submissions" on public.submissions;
create policy "Users can create their own submissions"
  on public.submissions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- SUBMISSIONS STORAGE BUCKET ----------------------------------------------
-- Files are uploaded to `${user.id}/${filename}` (see Submissions.jsx), so
-- a user's own folder is identified by the first path segment matching
-- their auth uid.
drop policy if exists "Users can upload to their own submissions folder" on storage.objects;
create policy "Users can upload to their own submissions folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can read their own submission files" on storage.objects;
create policy "Users can read their own submission files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
