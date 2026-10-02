begin;
create table public.deleted_financial_records (
  table_name text not null check(table_name in ('transactions','bills','goals','subscriptions','splits')),
  record_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  deleted_at timestamptz not null default now(),
  primary key(table_name, record_id)
);
alter table public.deleted_financial_records enable row level security;
create policy tombstones_owner_select on public.deleted_financial_records for select to authenticated
  using ((select auth.uid())=user_id);
revoke all on public.deleted_financial_records from anon, authenticated;
grant select on public.deleted_financial_records to authenticated;

create or replace function public.remember_financial_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Do not create tombstones during account-deletion cascades.
  if exists(select 1 from auth.users where id=old.user_id) then
    insert into public.deleted_financial_records(table_name,record_id,user_id)
    values(tg_table_name,old.id,old.user_id) on conflict do nothing;
  end if;
  return old;
end;
$$;
create or replace function public.prevent_financial_resurrection()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.deleted_financial_records where table_name=tg_table_name and record_id=new.id) then
    raise exception 'Record is unavailable; reload before editing';
  end if;
  return new;
end;
$$;
do $$ declare t text; begin
  foreach t in array array['transactions','bills','goals','subscriptions','splits'] loop
    execute format('create trigger remember_delete after delete on public.%I for each row execute function public.remember_financial_delete()',t);
    execute format('create trigger prevent_resurrection before insert on public.%I for each row execute function public.prevent_financial_resurrection()',t);
  end loop;
end $$;
revoke all on function public.remember_financial_delete() from public, anon, authenticated;
revoke all on function public.prevent_financial_resurrection() from public, anon, authenticated;
commit;
