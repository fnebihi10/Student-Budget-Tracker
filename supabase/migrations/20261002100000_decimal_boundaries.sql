begin;
-- Unsized numeric preserves the input scale until CHECK evaluation. The old
-- numeric(12,2) silently rounded 1.005 before a trigger could validate it.
alter table public.transactions alter column amount type numeric;
alter table public.bills alter column amount type numeric;
alter table public.subscriptions alter column amount type numeric;
alter table public.splits alter column amount type numeric;
alter table public.goals alter column target type numeric, alter column saved type numeric, alter column starting_balance type numeric;
alter table public.user_settings alter column monthly_budget type numeric;
alter table public.transactions add constraint transactions_precision check (scale(amount)<=2 and amount<=9999999999.99);
alter table public.bills add constraint bills_precision check (scale(amount)<=2 and amount<=9999999999.99);
alter table public.subscriptions add constraint subscriptions_precision check (scale(amount)<=2 and amount<=9999999999.99);
alter table public.splits add constraint splits_precision check (scale(amount)<=2 and amount<=9999999999.99);
alter table public.goals add constraint goals_precision check (scale(target)<=2 and target<=9999999999.99 and scale(saved)<=2 and saved<=9999999999.99 and scale(starting_balance)<=2 and abs(starting_balance)<=9999999999.99) not valid;
-- Inferred legacy opening balances may exceed the row limit; retain and audit
-- those existing records rather than failing the migration or rewriting money.
alter table public.user_settings add constraint settings_precision check (scale(monthly_budget)<=2 and monthly_budget<=9999999999.99);
commit;
