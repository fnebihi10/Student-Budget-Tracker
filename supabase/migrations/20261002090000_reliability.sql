-- Forward-only. Back up first; run against a disposable database before rollout.
begin;

alter table public.profiles add column revision bigint not null default 0;
alter table public.user_settings add column revision bigint not null default 0;
alter table public.transactions add column revision bigint not null default 0;
alter table public.bills add column revision bigint not null default 0;
alter table public.subscriptions add column revision bigint not null default 0;
alter table public.goals add column revision bigint not null default 0;
alter table public.splits add column revision bigint not null default 0;

alter table public.bills add column payment_history jsonb not null default '{}'::jsonb
  check (jsonb_typeof(payment_history) = 'object');
update public.bills set payment_history = jsonb_build_object(paid_month, jsonb_build_object('paidAt', null, 'source', 'legacy'))
  where paid_month is not null;

-- Preserve every saved total and activity entry. A negative inferred opening
-- balance indicates inconsistent legacy history; do not silently rewrite it.
alter table public.goals add column starting_balance numeric not null default 0;
update public.goals g set starting_balance = saved - coalesce((
  select sum((a->>'amount')::numeric) from jsonb_array_elements(g.activity) a
  where coalesce(a->>'amount', '') ~ '^-?[0-9]+(\.[0-9]+)?$'
), 0);

create or replace function public.guard_financial_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.user_id <> old.user_id then raise exception 'Record ownership is immutable'; end if;
  if new.revision <> old.revision + 1 then raise exception 'Stale or unversioned write; reload before editing'; end if;
  return new;
end;
$$;
create trigger transactions_guard before update on public.transactions for each row execute function public.guard_financial_update();
create trigger bills_guard before update on public.bills for each row execute function public.guard_financial_update();
create trigger subscriptions_guard before update on public.subscriptions for each row execute function public.guard_financial_update();
create trigger goals_guard before update on public.goals for each row execute function public.guard_financial_update();
create trigger splits_guard before update on public.splits for each row execute function public.guard_financial_update();

create or replace function public.guard_settings_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.user_id <> old.user_id then raise exception 'Record ownership is immutable'; end if;
  if new.currency <> old.currency and (
    exists(select 1 from public.transactions where user_id = old.user_id) or
    exists(select 1 from public.bills where user_id = old.user_id) or
    exists(select 1 from public.subscriptions where user_id = old.user_id) or
    exists(select 1 from public.goals where user_id = old.user_id) or
    exists(select 1 from public.splits where user_id = old.user_id)
  ) then raise exception 'Currency cannot change while financial records exist'; end if;
  if new.subscription_plan <> old.subscription_plan or new.subscription_status <> old.subscription_status then
    raise exception 'Paid entitlements cannot be changed by the client';
  end if;
  if new.revision <> old.revision + 1 then raise exception 'Stale or unversioned write; reload before editing'; end if;
  return new;
end;
$$;
create trigger settings_guard before update on public.user_settings for each row execute function public.guard_settings_update();

create or replace function public.guard_profile_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.id <> old.id then raise exception 'Record ownership is immutable'; end if;
  if new.revision <> old.revision + 1 then raise exception 'Stale or unversioned write; reload before editing'; end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_update();

-- Clients must not delete/reinsert settings to bypass currency and entitlement
-- guards. Signup initializes these rows using the existing trusted trigger.
revoke insert, delete on public.user_settings from authenticated;
revoke insert, delete on public.profiles from authenticated;
create index goals_user_created_id_idx on public.goals(user_id, created_at desc, id desc);
create index splits_user_created_id_idx on public.splits(user_id, created_at desc, id desc);
create index bills_user_created_id_idx on public.bills(user_id, created_at desc, id desc);
create index transactions_user_date_id_idx on public.transactions(user_id, transaction_date desc, id desc);
create index subscriptions_user_created_id_idx on public.subscriptions(user_id, created_at desc, id desc);

commit;
