create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '' check (char_length(name) <= 80),
  school text not null default '' check (char_length(school) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'EUR' check (currency in ('EUR', 'USD', 'GBP', 'HUF')),
  monthly_budget numeric(12,2) not null default 900 check (monthly_budget > 0),
  notifications boolean not null default true,
  category_budgets jsonb not null default '{}'::jsonb check (jsonb_typeof(category_budgets) = 'object'),
  subscription_plan text not null default 'free' check (subscription_plan in ('free', 'pro')),
  subscription_status text not null default 'inactive' check (subscription_status in ('inactive', 'active', 'canceled')),
  updated_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (char_length(category) between 1 and 40),
  title text not null check (char_length(title) between 1 and 80),
  note text not null default '' check (char_length(note) <= 500),
  transaction_date timestamptz not null default now(),
  recurring boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  amount numeric(12,2) not null check (amount > 0),
  category text not null check (char_length(category) between 1 and 40),
  due_day smallint not null check (due_day between 1 and 31),
  paid_month text check (paid_month is null or paid_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id text not null default 'other',
  name text not null check (char_length(name) between 1 and 80),
  amount numeric(12,2) not null check (amount > 0),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  next_billing_date timestamptz not null,
  category text not null default 'other',
  reminder_days smallint not null default 3 check (reminder_days between 0 and 30),
  notes text not null default '' check (char_length(notes) <= 500),
  free_trial boolean not null default false,
  icon text,
  color text,
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id text not null default 'other',
  name text not null check (char_length(name) between 1 and 80),
  target numeric(12,2) not null check (target > 0),
  saved numeric(12,2) not null default 0 check (saved >= 0),
  deadline timestamptz,
  icon text,
  color text,
  notes text not null default '' check (char_length(notes) <= 500),
  activity jsonb not null default '[]'::jsonb check (jsonb_typeof(activity) = 'array'),
  created_at timestamptz not null default now()
);

create table public.splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  person text not null check (char_length(person) between 1 and 80),
  amount numeric(12,2) not null check (amount > 0),
  direction text not null check (direction in ('owed_to_me', 'i_owe')),
  category text not null default 'other',
  due_date timestamptz,
  note text not null default '' check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'settled')),
  settled_at timestamptz,
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index bills_user_idx on public.bills(user_id);
create index subscriptions_user_date_idx on public.subscriptions(user_id, next_billing_date);
create index goals_user_deadline_idx on public.goals(user_id, deadline);
create index splits_user_due_idx on public.splits(user_id, due_date);

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.bills enable row level security;
alter table public.subscriptions enable row level security;
alter table public.goals enable row level security;
alter table public.splits enable row level security;

create policy "profiles_owner_all" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "settings_owner_all" on public.user_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "transactions_owner_all" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "bills_owner_all" on public.bills
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "subscriptions_owner_all" on public.subscriptions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "goals_owner_all" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "splits_owner_all" on public.splits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon;
revoke all on table public.user_settings from anon;
revoke all on table public.transactions from anon;
revoke all on table public.bills from anon;
revoke all on table public.subscriptions from anon;
revoke all on table public.goals from anon;
revoke all on table public.splits from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.user_settings to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;
grant select, insert, update, delete on table public.bills to authenticated;
grant select, insert, update, delete on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.goals to authenticated;
grant select, insert, update, delete on table public.splits to authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger settings_set_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  initial_budget numeric(12,2) := 900;
begin
  if coalesce(new.raw_user_meta_data ->> 'monthly_budget', '') ~ '^\d+(\.\d{1,2})?$' then
    initial_budget := greatest((new.raw_user_meta_data ->> 'monthly_budget')::numeric, 0.01);
  end if;

  insert into public.profiles (id, name, school)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 80),
    left(coalesce(new.raw_user_meta_data ->> 'school', ''), 160)
  );

  insert into public.user_settings (user_id, monthly_budget)
  values (new.id, initial_budget);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
