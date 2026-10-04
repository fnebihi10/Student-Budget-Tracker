const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');

(async () => {
  // Disposable WASM PostgreSQL, no network or production credentials. Models
  // Supabase's auth schema/JWT uid for SQL isolation tests, not Auth delivery.
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
  `);
  for (const file of fs.readdirSync('supabase/migrations').sort()) {
    // gen_random_uuid is built into PostgreSQL. PGlite does not ship pgcrypto;
    // this is the only omitted statement; production migrations stay intact.
    const sql = fs.readFileSync(path.join('supabase/migrations', file), 'utf8').replace('create extension if not exists pgcrypto;', '');
    await db.exec(sql);
  }
  const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  await db.exec(`insert into auth.users(id) values ('${a}'),('${b}')`);
  const asUser = async (id) => db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '${id}';`);
  const fail = async (sql) => { await assert.rejects(() => db.exec(sql)); };
  await asUser(a);
  const records = {
    transactions: `type,amount,category,title`,
    bills: `title,amount,category,due_day`,
    goals: `name,target`,
    subscriptions: `name,amount,frequency,next_billing_date`,
    splits: `title,person,amount,direction`,
  };
  const values = {
    transactions: `'expense',10,'food','A transaction'`,
    bills: `'A bill',10,'housing',31`,
    goals: `'A goal',100`,
    subscriptions: `'A subscription',10,'weekly','2026-10-02T12:00:00Z'`,
    splits: `'A debt','Person',10,'i_owe'`,
  };
  for (const table of Object.keys(records)) {
    await db.exec(`insert into public.${table}(user_id,${records[table]}) values ('${a}',${values[table]})`);
    await fail(`insert into public.${table}(user_id,${records[table]}) values ('${b}',${values[table]})`);
    await fail(`update public.${table} set user_id='${b}' where user_id='${a}'`);
  }
  await fail(`update public.user_settings set currency='USD' where user_id='${a}'`);
  await fail(`update public.user_settings set subscription_plan='pro' where user_id='${a}'`);
  await fail(`delete from public.user_settings where user_id='${a}'`);
  await fail(`insert into public.transactions(user_id,type,amount,category,title) values ('${a}','expense',-1,'food','Invalid')`);
  await fail(`insert into public.transactions(user_id,type,amount,category,title) values ('${a}','expense',1.005,'food','Excess precision')`);
  await fail(`insert into public.goals(user_id,name,target,saved,starting_balance) values ('${a}','Unreconciled',100,50,0)`);
  await fail(`update public.transactions set amount=11 where user_id='${a}'`);
  const updated = await db.query(`update public.transactions set amount=11, revision=1 where user_id='${a}' and revision=0 returning revision`);
  assert.equal(Number(updated.rows[0].revision), 1);
  const stale = await db.query(`update public.transactions set amount=12, revision=1 where user_id='${a}' and revision=0 returning id`);
  assert.equal(stale.rows.length, 0);
  const totalsA=await db.query("select * from public.monthly_totals(to_char(now() at time zone 'UTC','YYYY-MM'))");
  assert.equal(Number(totalsA.rows[0].expenses),11);
  const deleted=await db.query(`delete from public.transactions where user_id='${a}' returning id`);
  const deletedId=deleted.rows[0].id;
  await fail(`insert into public.transactions(id,user_id,type,amount,category,title) values ('${deletedId}','${a}','expense',11,'food','Stale snapshot') on conflict(id) do update set amount=11`);
  assert.equal((await db.query(`select * from public.deleted_financial_records where user_id='${a}'`)).rows.length,1);
  await asUser(b);
  const totalsB=await db.query("select * from public.monthly_totals(to_char(now() at time zone 'UTC','YYYY-MM'))");
  assert.equal(Number(totalsB.rows[0].expenses),0);
  assert.equal((await db.query(`select * from public.deleted_financial_records where user_id='${a}'`)).rows.length,0);
  await fail(`delete from public.deleted_financial_records`);
  for (const table of [...Object.keys(records), 'profiles', 'user_settings']) {
    const owner = table === 'profiles' ? 'id' : 'user_id';
    const result = await db.query(`select * from public.${table} where ${owner}='${a}'`);
    assert.equal(result.rows.length, 0, `${table} leaks A to B`);
    const changed = await db.query(`delete from public.${table} where ${owner}='${a}' returning ${owner}`).catch((error) => {
      if (['profiles', 'user_settings'].includes(table)) return { rows: [] };
      throw error;
    });
    assert.equal(changed.rows.length, 0);
  }
  await asUser(a);
  const paymentBill = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const operation = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
  const otherOperation = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  await db.exec(`insert into public.bills(id,user_id,title,amount,category,due_day) values ('${paymentBill}','${a}','Atomic bill',12.34,'food',3)`);
  const pay = (id = operation, record = true, period = '2026-10', revision = 0) => db.query(
    `select public.record_bill_payment('${id}','${paymentBill}','${period}',${revision},${record},'2026-10-03T12:00:00Z') as receipt`);
  const receipt = (await pay()).rows[0].receipt;
  assert.equal(receipt.bill.revision, 1);
  assert.equal(receipt.transaction.id, operation);
  assert.deepEqual((await pay()).rows[0].receipt, receipt); // Lost response retry.
  assert.deepEqual((await pay(otherOperation)).rows[0].receipt, receipt); // Duplicate click, new UUID.
  assert.equal((await db.query(`select * from public.transactions where id='${operation}'`)).rows.length, 1);
  await assert.rejects(() => pay(operation, false)); // Cannot change intent on retry.
  await assert.rejects(() => pay(otherOperation, false, '2026-11', 0)); // Stale revision.
  const marked = (await pay(otherOperation, false, '2026-11', 1)).rows[0].receipt;
  assert.equal(marked.transaction, null);
  assert.equal(marked.bill.revision, 2);
  // Force failure in the transaction insert; the bill and receipt roll back.
  const collision = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  await db.exec(`insert into public.transactions(id,user_id,type,amount,category,title) values ('${collision}','${a}','expense',1,'food','Existing transaction')`);
  await assert.rejects(() => pay(collision, true, '2026-12', 2));
  assert.equal((await db.query(`select payment_history ? '2026-12' as paid from public.bills where id='${paymentBill}'`)).rows[0].paid, false);
  assert.equal((await db.query(`select * from public.financial_operations where id='${collision}'`)).rows.length, 0);
  // Immutable receipt metadata must not replay an old or deleted ledger row.
  await db.exec(`update public.transactions set title='Reviewed payment', revision=revision+1 where id='${operation}'`);
  assert.equal((await pay()).rows[0].receipt.transaction.title, 'Reviewed payment');
  assert.equal((await pay()).rows[0].receipt.bill.revision, 2);
  await db.exec(`delete from public.transactions where id='${operation}'`);
  assert.equal((await pay()).rows[0].receipt.transaction, null);
  assert.equal((await pay('abababab-abab-4bab-8bab-abababababab')).rows[0].receipt.transaction, null);
  await db.exec(`update public.bills set payment_history=payment_history-'2026-10',revision=revision+1 where id='${paymentBill}'`);
  await assert.rejects(() => pay()); // Unmarking never makes an existing payment replayable as a new expense.
  assert.equal((await db.query(`select * from public.transactions where id='${operation}'`)).rows.length, 0);
  await fail(`insert into public.financial_operations(id,user_id,bill_id,period,record_transaction,response) values ('${collision}','${a}','${paymentBill}','2026-12',true,'{}')`);
  await asUser(b);
  assert.equal((await db.query('select * from public.financial_operations')).rows.length, 0);
  await assert.rejects(() => pay());
  await db.exec(`reset role; set role anon; set request.jwt.claim.sub = '';`);
  for (const table of [...Object.keys(records), 'profiles', 'user_settings']) {
    await fail(`select * from public.${table}`);
    await fail(`insert into public.${table} default values`);
  }
  await fail('select public.delete_own_account()');
  await fail("select public.monthly_totals('2026-10')");
  await assert.rejects(() => pay());
  await db.exec(`reset role; set role authenticated; set request.jwt.claim.sub = '';`);
  await fail('select public.delete_own_account()');
  await asUser(a);
  await db.exec('select public.delete_own_account()');
  await db.exec('reset role');
  assert.equal((await db.query(`select * from auth.users where id='${a}'`)).rows.length, 0);
  assert.equal((await db.query(`select * from auth.users where id='${b}'`)).rows.length, 1);
  for (const table of Object.keys(records)) assert.equal((await db.query(`select * from public.${table} where user_id='${a}'`)).rows.length, 0);
  assert.equal((await db.query(`select * from public.deleted_financial_records where user_id='${a}'`)).rows.length,0);
  assert.equal((await db.query(`select * from public.financial_operations where user_id='${a}'`)).rows.length,0);
  await db.close();
  console.log('PASS: all migrations, anonymous/two-user RLS, immutable ownership, currency/entitlement guards, revision conflicts, self-deletion and cascades (disposable PGlite).');
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
