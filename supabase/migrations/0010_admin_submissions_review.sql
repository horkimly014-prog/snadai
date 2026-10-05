-- Admin role table + admin access to submissions for the new admin review page.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can view own admin row"
  on public.admin_users
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Restrict submission status to a known set of values.
alter table public.submissions
  add constraint submissions_status_check
  check (status in ('pending', 'approved', 'rejected'));

-- Admins can see every submission (regular users already have their own-row policy).
create policy "Admins can view all submissions"
  on public.submissions
  for select
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()));

-- Admins can update a submission's status (approve/reject).
create policy "Admins can update submission status"
  on public.submissions
  for update
  to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

-- Admins can view every uploaded submission file (artwork images), not just their own.
create policy "Admins can view all submission files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'submissions'
    and exists (select 1 from public.admin_users where user_id = auth.uid())
  );
