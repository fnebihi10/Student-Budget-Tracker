# Forward migration and recovery guide

No production database was modified during this upgrade. Before deployment,
back up the database and device exports, rehearse on a disposable Supabase
project, and record applied versions with the Supabase migration tooling.
Apply only unapplied files in filename order, including existing initial-schema
migrations. Do not rerun CREATE TABLE migrations from the SQL Editor blindly.

1. `20261002090000_reliability.sql`: revisions/immutable ownership, payment
   history, inferred goal opening balances, currency and entitlement protections.
2. `20261002093000_period_plans_and_goal_validation.sql`: period budgets,
   goal reconciliation and owner-scoped monthly totals.
3. `20261002100000_decimal_boundaries.sql`: exact decimal boundary checks;
   NOT VALID goal constraints preserve legacy rows while enforcing future writes.
4. `20261002103000_deletion_tombstones.sql`: permanent deletion markers and
   resurrection prevention; account deletion cascades remove its markers.

Apply these migrations before enabling authenticated writes from the new client.
Coordinate the client rollout: old clients that omit revision increments will
fail edits instead of overwriting newer data. Do not roll back to an old writer,
remove ownership/version triggers or delete tombstones as a troubleshooting step.
Use a forward corrective migration if needed.

Existing cloud records keep their IDs, owners and values. Bill history recovers
only the known paidMonth. Goal starting balance is saved minus signed activity;
inconsistent legacy history is preserved, potentially yielding negative opening
balances. Review affected records against a backup; never silently clamp balances
or fabricate contributions. Invalid legacy JSON may prevent client validation
and needs audited administrative repair. Period history is not invented.

Legacy global AsyncStorage keys remain untouched and quarantined. The app cannot
prove which account wrote them, so it never attaches them to a signed-in user or
demo. To recover them, preserve a copy on the original device, identify ownership
with the user, compare against a verified cloud export, and use a reviewed
administrative recovery process. There is no automatic import button. Avoid
uninstalling/clearing storage until recovery evidence is saved.

On a failed or timed-out mutation, reload first: the cloud may have committed it.
Stable IDs, revisions and payment/contribution histories let the user reconcile
the result. Do not blindly resubmit. On a conflict, reload and reapply the intended
edit to the current record. A deleted ID cannot be restored; an intentional new
record requires a new UUID. Logout retains scoped cache but never exposes it to
another account; account deletion clears that user's local cache and auth keys.

`npm run test:database` runs all migrations in disposable PGlite PostgreSQL with
modeled auth roles and auth.uid(). It omits only CREATE EXTENSION pgcrypto because
gen_random_uuid is built in there. This does not replace a live Supabase rehearsal
of Auth, PostgREST, email links, RLS/RPC HTTP calls and concurrent devices.
