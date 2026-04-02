create table if not exists public.user_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.user_snapshots enable row level security;

create policy "Users can view their own snapshot"
on public.user_snapshots
for select
using (auth.uid() = user_id);

create policy "Users can insert their own snapshot"
on public.user_snapshots
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own snapshot"
on public.user_snapshots
for update
using (auth.uid() = user_id);
