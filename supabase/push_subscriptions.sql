create table if not exists public.push_subscriptions (
  endpoint text primary key,
  p256dh text not null,
  auth text not null,
  user_id uuid null,
  device_id text not null,
  user_agent text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_device_id_idx
  on public.push_subscriptions (device_id);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);
