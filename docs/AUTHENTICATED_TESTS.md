# Isolated authenticated verification

Status on 2026-10-04: **UNVERIFIED**. Dedicated credentials were unavailable.
The harness exits with code 2 before creating a client when configuration is
missing. Local PGlite and mocked session tests are complementary evidence, not
equivalent to real Auth, PostgREST, RPC, or device behavior.

The [current-checkout continuation](RELEASE_FOLLOWUP.md) confirmed credentials
are still absent. Authenticated Playwright now checks the isolated configuration
and `dist-test/index.html` before starting its server/browser, and never reuses
an existing server. Missing setup fails explicitly; it is not a skipped pass.
Stop any process occupying port 4173 before this run. Keep logs outside
`test-results`, which Playwright clears at startup (for example
`.expo/release-followup/`). Hosted fixture cleanup remains unverified until an
actual isolated run completes; retain teardown results and verify fixture users
and owner-scoped rows are gone. [Native preparation](NATIVE_VERIFICATION.md)
includes public-only build environment commands and separate device results.

## Project preparation

Use a disposable Supabase project containing no production users or records.
Do not reuse `.env.local`, a production project reference, or production keys.
This harness creates temporary users and financial records and deletes those
users in cleanup. It never resets the project or deletes pre-existing users.

1. Apply every SQL file in `supabase/migrations` in filename order to the
   **isolated project only**, using its SQL editor or a separately verified test
   project CLI connection. Read [migration guidance](MIGRATIONS.md) first.
2. Configure Auth redirects for `http://127.0.0.1:4173/**` and the web site URL
   `http://127.0.0.1:4173`. Browser recovery follows the admin-generated action
   link; redirect allowlisting is required. Do not change production Auth settings.
3. For the expiry test, configure a short test-project JWT expiry (60 seconds,
   where supported). The harness waits at most the configured 90 seconds;
   longer-lived tokens now fail verification instead of skipping a required check. Refresh rotation
   and revoked refresh-token tests run separately. Issued access JWTs can remain
   valid until expiry after refresh revocation.
4. Copy `.env.supabase-test.example` to `.env.supabase-test.local` (ignored by
   git) and supply only the isolated project's values. The service-role key is
   test-runner-only and must never become an `EXPO_PUBLIC_*` variable. The URL
   must match the acknowledged project reference. The acknowledgement is an
   explicit operator assertion of isolation; the code cannot prove ownership.

## Exact local commands (Node 22.21, PowerShell)

```powershell
npm ci
node --env-file=.env.supabase-test.local integration/supabase.test.cjs
node --env-file=.env.supabase-test.local scripts/export.cjs --test-project
$env:E2E_AUTHENTICATED = '1'
node --env-file=.env.supabase-test.local node_modules/@playwright/test/cli.js test
Remove-Item Env:E2E_AUTHENTICATED
```

Install Chromium using `npx playwright install chromium` if Edge is unavailable.
The export disables normal dotenv loading, supplies only test public credentials,
removes the test service key from the Expo subprocess, and writes `dist-test`.
Playwright starts a loopback server and runs only `e2e/authenticated.spec.js` in
this mode. Never deploy this test build. Inspect cleanup failures and remove only
the fixture user IDs reported by the runner, through the isolated project's admin
console. Do not run broad cleanup SQL.

## Coverage and interpretation

`integration/supabase.test.cjs` exercises real signup confirmation tokens and
single-use behavior, anonymous denial, two-user ownership, monthly aggregates,
remote revision/deletion checks, concurrent payment RPC calls, replayed operation
IDs, tracker-only payments, atomic rollback, refresh rotation, revoked refresh,
real JWT expiry when configured, password recovery and old-password rejection,
self-service account deletion and cascades. Fixtures use random emails/UUIDs.

The authenticated browser suite exercises login, transactions, remote changes
and deletion while editing, focus-triggered reconciliation, bill history and
payment, subscriptions, goal withdrawals, personal debt settlement, downloads,
request-failure recovery, and the recovery form at all four widths with axe.
It uses admin-generated confirmation/recovery links: it **does not verify SMTP
delivery, inbox handling, or native PKCE/deep-link handling**. Those require a
test mailbox and installed native development builds. Automatic resume during a
pending write is covered locally by the confirmed-store/lifecycle regression
suite; two physical devices and real network timing remain an additional check.

Run the manual `Isolated Supabase verification` GitHub Actions workflow after
configuring the `supabase-isolated-test` environment with the four dedicated
secrets. Require environment reviewers if your project policy calls for them.
Migrations must already be applied to that isolated environment. The workflow
retains failure traces/screenshots and HTML reports. The isolated workflow has
not been executed remotely for authenticated verification. The separate demo quality job
passed remotely; it does not exercise hosted accounts. A metadata-only query of
the `supabase-isolated-test` environment returned HTTP 404 on 2026-10-04, so no
claim is made that its secrets are configured. Do not dispatch until isolation,
migrations, redirects and credentials are confirmed. The integration console log
is retained on both success and failure; an expiry check outside its configured
wait bound fails the run with an explicit UNVERIFIED reason.

## Required device and email rehearsal

On Android and iOS separately: confirm signup via an actual test email; recover
a password from a cold start and a running app; reject expired/reused links;
background A, change/delete a record on B, resume A; repeat during a delayed
mutation; revoke refresh credentials during a request; verify one load per
feature for repeated resumes. Check logout and account deletion do not expose
another account's cached data. Record device/OS, steps, screenshots, network
counts, and observed results. These checks remain unverified here.
