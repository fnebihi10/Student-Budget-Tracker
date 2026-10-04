begin;
create table public.financial_operations (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid not null,
  period text not null,
  record_transaction boolean not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, bill_id, period)
);
alter table public.financial_operations enable row level security;
create policy operations_owner_read on public.financial_operations for select to authenticated using (user_id = (select auth.uid()));
-- Only the narrowly scoped RPC writes immutable receipts.
revoke all on public.financial_operations from anon, authenticated;
grant select on public.financial_operations to authenticated;

create function public.record_bill_payment(operation_id uuid, bill_id uuid, period text,
  expected_revision bigint, record_transaction boolean, paid_at timestamptz)
returns jsonb language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare owner_id uuid := auth.uid(); bill public.bills; receipt public.financial_operations;
  payment public.transactions; response jsonb;
begin
  if owner_id is null then raise exception 'Authentication required'; end if;
  if operation_id is null or bill_id is null or paid_at is null or record_transaction is null
    or expected_revision is null or expected_revision < 0 or period is null
    or period !~ '^\d{4}-(0[1-9]|1[0-2])$' then raise exception 'Invalid payment request'; end if;
  -- Transaction-scoped serialization covers both stable-ID retries and different
  -- operation IDs submitted concurrently for the same bill occurrence.
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text || operation_id::text, 0));
  select * into receipt from public.financial_operations o where o.id = operation_id;
  if found then
    if receipt.user_id <> owner_id or receipt.bill_id <> bill_id or receipt.period <> period
      or receipt.record_transaction <> record_transaction then raise exception 'Operation ID reused for a different request'; end if;
    select * into bill from public.bills b where b.id = bill_id and b.user_id = owner_id for update;
    if not found then raise exception 'Bill deleted or unavailable'; end if;
    if not (bill.payment_history ? period) and bill.paid_month is distinct from period then
      raise exception 'Payment already recorded; mark the tracker paid without another transaction';
    end if;
    select * into payment from public.transactions t
      where t.id = (receipt.response->'transaction'->>'id')::uuid and t.user_id = owner_id;
    return receipt.response || jsonb_build_object('bill', to_jsonb(bill), 'transaction', case when payment.id is null then null else to_jsonb(payment) end);
  end if;
  select * into bill from public.bills b where b.id = bill_id and b.user_id = owner_id for update;
  if not found then raise exception 'Bill deleted or unavailable'; end if;
  select * into receipt from public.financial_operations o
    where o.user_id = owner_id and o.bill_id = bill_id and o.period = period;
  if found then
    if receipt.record_transaction <> record_transaction then raise exception 'Payment already recorded; review transaction history'; end if;
    if not (bill.payment_history ? period) and bill.paid_month is distinct from period then
      raise exception 'Payment already recorded; mark the tracker paid without another transaction';
    end if;
    select * into payment from public.transactions t
      where t.id = (receipt.response->'transaction'->>'id')::uuid and t.user_id = owner_id;
    return receipt.response || jsonb_build_object('bill', to_jsonb(bill), 'transaction', case when payment.id is null then null else to_jsonb(payment) end);
  end if;
  if bill.revision <> expected_revision then raise exception 'Bill changed; reload before recording payment'; end if;
  if bill.paid_month = period or bill.payment_history ? period then raise exception 'Already marked paid; review transaction history before recording an expense'; end if;
  if record_transaction then
    insert into public.transactions(id, user_id, type, amount, category, title, note, transaction_date)
      values (operation_id, owner_id, 'expense', bill.amount, bill.category, bill.title, 'Bill payment ' || period, paid_at)
      returning * into payment;
  end if;
  update public.bills b set paid_month = period,
    payment_history = b.payment_history || jsonb_build_object(period,
      jsonb_build_object('paidAt', paid_at, 'amount', bill.amount, 'operationId', operation_id,
        'transactionId', case when record_transaction then operation_id else null end)),
    revision = b.revision + 1 where b.id = bill_id and b.user_id = owner_id returning * into bill;
  response := jsonb_build_object('bill', to_jsonb(bill), 'transaction', case when record_transaction then to_jsonb(payment) else null end);
  insert into public.financial_operations(id, user_id, bill_id, period, record_transaction, response)
    values (operation_id, owner_id, bill_id, period, record_transaction, response);
  return response;
end;
$$;
revoke all on function public.record_bill_payment(uuid,uuid,text,bigint,boolean,timestamptz) from public, anon;
grant execute on function public.record_bill_payment(uuid,uuid,text,bigint,boolean,timestamptz) to authenticated;
commit;
