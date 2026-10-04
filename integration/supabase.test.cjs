const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');

// Deliberately never loads .env.local or EXPO_PUBLIC_* credentials.
const required = ['SUPABASE_TEST_URL', 'SUPABASE_TEST_ANON_KEY', 'SUPABASE_TEST_SERVICE_ROLE_KEY', 'SUPABASE_TEST_PROJECT_REF'];
if (required.some((key) => !process.env[key]) || process.env.SUPABASE_TEST_ALLOW_DESTRUCTIVE !== 'isolated-test-only') {
  console.error('UNVERIFIED: isolated Supabase credentials and explicit test-project acknowledgement required. See docs/AUTHENTICATED_TESTS.md.');
  process.exit(2);
}
const url = new URL(process.env.SUPABASE_TEST_URL);
if (url.hostname !== `${process.env.SUPABASE_TEST_PROJECT_REF}.supabase.co` && !['localhost', '127.0.0.1'].includes(url.hostname)) {
  throw new Error('Test URL does not match the explicitly acknowledged project reference.');
}
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const client = () => createClient(url.href, process.env.SUPABASE_TEST_ANON_KEY, options);
const admin = createClient(url.href, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY, options);
const anonymous = client(), a = client(), a2 = client(), b = client();
const password = `Pocketwise-${randomUUID()}-9!`;
const ids = new Set();
let userA, userB, expiredSession;
const ok = (result) => { assert.equal(result.error, null, result.error?.message); return result.data; };
async function signup(name, target) {
  const email = `pocketwise-test-${randomUUID()}@example.com`;
  const link = ok(await admin.auth.admin.generateLink({ type: 'signup', email, password, options: { data: { name, monthly_budget: 900 } } }));
  ids.add(link.user.id);
  const confirmed = ok(await target.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'signup' }));
  assert.equal(confirmed.user.id, link.user.id);
  assert.ok((await anonymous.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'signup' })).error, 'confirmation tokens must be single use');
  return confirmed.user;
}
before(async () => {
  userA = await signup('Integration A', a);
  userB = await signup('Integration B', b);
  ok(await a2.auth.signInWithPassword({ email: userA.email, password }));
  expiredSession = ok(await a.auth.getSession()).session;
});
after(async () => {
  const failures = [];
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error && !/not found/i.test(error.message)) failures.push(error.message);
  }
  for (const c of [a, a2, b, anonymous]) await c.auth.signOut({ scope: 'local' });
  assert.deepEqual(failures, [], 'Test fixture cleanup failed');
});

test('anonymous access and two-user ownership over real PostgREST', async () => {
  for (const table of ['profiles', 'user_settings', 'transactions', 'bills', 'subscriptions', 'goals', 'splits', 'financial_operations']) {
    const result = await anonymous.from(table).select('*');
    assert.ok(result.error || result.data.length === 0, `Anonymous access to ${table}`);
  }
  const row = ok(await a.from('transactions').insert({ user_id: userA.id, type: 'expense', amount: 12.34, category: 'food', title: 'Isolated transaction' }).select().single());
  assert.equal(ok(await b.from('transactions').select('*').eq('id', row.id)).length, 0);
  assert.ok((await b.from('transactions').insert({ user_id: userA.id, type: 'expense', amount: 1, category: 'food', title: 'Denied' })).error);
  const denied = ok(await b.from('transactions').update({ title: 'Denied', revision: 1 }).eq('id', row.id).select());
  assert.equal(denied.length, 0);
  const totals = ok(await a.rpc('monthly_totals', { period: new Date().toISOString().slice(0, 7) }));
  assert.equal(Number(totals[0].expenses), 12.34);
  assert.ok((await anonymous.rpc('monthly_totals', { period: '2026-10' })).error);
});

test('multi-device revisions, deletion protection, and atomic payment retries/concurrency', async () => {
  const bill = ok(await a.from('bills').insert({ user_id: userA.id, title: 'Concurrent bill', amount: 24.5, category: 'housing', due_day: 3 }).select().single());
  ok(await a2.from('bills').update({ title: 'Device B update', revision: 1 }).eq('id', bill.id).eq('revision', 0).select().single());
  assert.equal(ok(await a.from('bills').select().eq('id', bill.id).single()).title, 'Device B update');
  assert.ok((await a.from('bills').update({ title: 'Stale edit', revision: 1 }).eq('id', bill.id).eq('revision', 0).select().single()).error);
  const params = { operation_id: randomUUID(), bill_id: bill.id, period: '2026-10', expected_revision: 1, record_transaction: true, paid_at: '2026-10-03T12:00:00Z' };
  const [first, duplicate] = await Promise.all([a.rpc('record_bill_payment', params), a2.rpc('record_bill_payment', { ...params, operation_id: randomUUID() })]);
  const receipt = ok(first); assert.deepEqual(ok(duplicate), receipt);
  assert.deepEqual(ok(await a.rpc('record_bill_payment', params)), receipt); // Discarded/lost first response.
  assert.equal(ok(await a.from('transactions').select().eq('id', receipt.transaction.id)).length, 1);
  assert.ok((await b.rpc('record_bill_payment', params)).error);
  const marked = ok(await a.rpc('record_bill_payment', { ...params, operation_id: randomUUID(), period: '2026-11', expected_revision: 2, record_transaction: false }));
  assert.equal(marked.transaction, null);
  const collision = randomUUID();
  ok(await a.from('transactions').insert({ id: collision, user_id: userA.id, type: 'expense', amount: 1, title: 'Collision', category: 'food' }));
  assert.ok((await a.rpc('record_bill_payment', { ...params, operation_id: collision, period: '2026-12', expected_revision: 3 })).error);
  const unchanged = ok(await a.from('bills').select().eq('id', bill.id).single());
  assert.equal(unchanged.revision, 3); assert.equal(unchanged.payment_history['2026-12'], undefined);
  ok(await a2.from('bills').delete().eq('id', bill.id));
  assert.ok((await a.from('bills').update({ title: 'Deleted edit', revision: 4 }).eq('id', bill.id).select().single()).error);
  assert.ok((await a.from('bills').insert({ id: bill.id, user_id: userA.id, title: 'Resurrection', amount: 1, category: 'food', due_day: 1 })).error);
});

test('real refresh rotation and password recovery token behavior', async () => {
  const refreshed = ok(await a.auth.refreshSession());
  assert.equal(refreshed.user.id, userA.id); assert.ok(refreshed.session.access_token);
  const link = ok(await admin.auth.admin.generateLink({ type: 'recovery', email: userB.email }));
  const recovery = client();
  ok(await recovery.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'recovery' }));
  const replacement = `${password}-reset`;
  ok(await recovery.auth.updateUser({ password: replacement }));
  assert.ok((await client().auth.signInWithPassword({ email: userB.email, password })).error);
  ok(await b.auth.signInWithPassword({ email: userB.email, password: replacement }));
  assert.ok((await anonymous.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: 'recovery' })).error);
  await recovery.auth.signOut({ scope: 'local' });
});

test('expired access token is denied and can recover through real refresh', async () => {
  const remaining = expiredSession.expires_at * 1000 - Date.now() + 2000;
  const limit = Number(process.env.SUPABASE_TEST_EXPIRY_WAIT_SECONDS || 90) * 1000;
  assert.ok(Number.isFinite(limit) && limit > 0, 'Expiry wait must be a positive finite number.');
  assert.ok(remaining <= limit, 'UNVERIFIED: configure short JWT expiry in the isolated project or increase SUPABASE_TEST_EXPIRY_WAIT_SECONDS. Required expiry verification cannot be skipped.');
  if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
  const response = await fetch(`${url.origin}/rest/v1/transactions?select=id`, { headers: { apikey: process.env.SUPABASE_TEST_ANON_KEY, Authorization: `Bearer ${expiredSession.access_token}` } });
  assert.equal(response.status, 401);
  ok(await a.auth.refreshSession());
  ok(await a.from('transactions').select('id'));
});

test('revoked refresh fails during a pending real request and requires reauthentication', async () => {
  const isolated = client(); const user = await signup('Revocation', isolated);
  const session = ok(await isolated.auth.getSession()).session;
  // PostgREST builders are lazy thenables. Start the request before revocation.
  const pending = isolated.from('user_settings').select().eq('user_id', user.id).then((result) => result);
  ok(await admin.auth.admin.signOut(session.access_token, 'global'));
  // An already issued JWT can remain valid until expiry; do not assume immediate revocation.
  const read = await pending; assert.ok(read.error || Array.isArray(read.data));
  assert.ok((await isolated.auth.refreshSession()).error);
  await isolated.auth.signOut({ scope: 'local' });
});

test('self deletion cascades records and leaves the other user intact', async () => {
  ok(await a.rpc('delete_own_account'));
  assert.ok((await admin.auth.admin.getUserById(userA.id)).error);
  ids.delete(userA.id);
  assert.equal(ok(await admin.from('transactions').select('id').eq('user_id', userA.id)).length, 0);
  assert.equal(ok(await admin.from('financial_operations').select('id').eq('user_id', userA.id)).length, 0);
  assert.equal(ok(await admin.auth.admin.getUserById(userB.id)).user.id, userB.id);
});
