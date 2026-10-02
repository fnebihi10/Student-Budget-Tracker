begin;
alter table public.user_settings add column period_budgets jsonb not null default '{}'::jsonb
  check (jsonb_typeof(period_budgets) = 'object');

create or replace function public.validate_goal_history()
returns trigger language plpgsql set search_path = '' as $$
declare a jsonb; contributions numeric := 0;
begin
  if tg_op = 'INSERT' and new.starting_balance < 0 then raise exception 'Starting savings cannot be negative'; end if;
  if tg_op = 'UPDATE' and new.starting_balance <> old.starting_balance then raise exception 'Starting balance is immutable'; end if;
  for a in select * from jsonb_array_elements(new.activity) loop
    if coalesce(a->>'amount','') !~ '^-?[0-9]+(\.[0-9]{1,2})?$' then raise exception 'Invalid contribution amount'; end if;
    contributions := contributions + (a->>'amount')::numeric;
  end loop;
  if new.saved <> new.starting_balance + contributions then raise exception 'Savings history must reconcile'; end if;
  return new;
end;
$$;
create trigger goals_validate_history before insert or update on public.goals
  for each row execute function public.validate_goal_history();

create or replace function public.monthly_totals(period text)
returns table(income numeric, expenses numeric, monthly_net numeric)
language plpgsql stable security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if period !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Invalid period'; end if;
  return query select
    coalesce(sum(t.amount) filter(where t.type='income'),0),
    coalesce(sum(t.amount) filter(where t.type='expense'),0),
    coalesce(sum(case when t.type='income' then t.amount else -t.amount end),0)
  from public.transactions t where t.user_id=auth.uid()
    and t.transaction_date >= ((period || '-01')::date::timestamp at time zone 'UTC')
    and t.transaction_date < (((period || '-01')::date + interval '1 month')::timestamp at time zone 'UTC');
end;
$$;
revoke all on function public.monthly_totals(text) from public, anon;
grant execute on function public.monthly_totals(text) to authenticated;
commit;
