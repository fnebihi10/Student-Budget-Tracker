const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;`);
    const files = fs.readdirSync('supabase/migrations').sort();
    const apply = (file) => db.exec(fs.readFileSync(path.join('supabase/migrations', file), 'utf8').replace('create extension if not exists pgcrypto;', ''));
    for (const file of files.filter((name) => name < '20261002090000')) await apply(file);
    const owner = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    await db.exec(`insert into auth.users(id) values ('${owner}');
      insert into public.goals(user_id,name,target,saved,activity) values
        ('${owner}','Inconsistent legacy goal',100,10,'[{"id":"legacy-entry","amount":20,"date":"2026-09-01","note":"Old deposit"}]'),
        ('${owner}','Legacy opening balance',100,40,'[]');
      insert into public.bills(user_id,title,amount,category,due_day,paid_month)
        values ('${owner}','Existing paid bill',30,'housing',4,'2026-09');`);
    for (const file of files.filter((name) => name >= '20261002090000')) await apply(file);
    const goals = (await db.query('select * from public.goals order by name')).rows;
    assert.equal(Number(goals[0].saved), 10); assert.equal(Number(goals[0].starting_balance), -10);
    assert.equal(goals[0].activity[0].amount, 20); assert.equal(Number(goals[1].starting_balance), 40);
    const bill = (await db.query('select * from public.bills')).rows[0];
    assert.deepEqual(bill.payment_history, { '2026-09': { paidAt: null, source: 'legacy' } });
    await db.exec(`update public.goals set notes='Reviewed legacy record', revision=revision+1 where name='Inconsistent legacy goal'`);
    assert.equal((await db.query('select * from public.financial_operations')).rows.length, 0);
    console.log('PASS: legacy totals/history, negative inferred openings, and known paid bill occurrence preserved by every forward migration.');
  } finally { await db.close(); }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
