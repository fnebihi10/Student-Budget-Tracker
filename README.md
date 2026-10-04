# Pocketwise

A calm green student-finance app for web, Android and iOS, built with Expo SDK 57,
React Native, React Navigation and Supabase. This upgrade preserves existing
cloud records and quarantines legacy device caches whose owner cannot be proven.

## Setup

Use Node 22.21 (`.nvmrc`) and the committed lockfile:

```powershell
npm ci
npm start
```

Demo mode works without Supabase configuration. For authenticated use, copy
`.env.example` to `.env.local` and set `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never put service-role credentials or
DB passwords in a client environment variable. Apply the forward migrations
before authenticated writes; see [migration and recovery guide](docs/MIGRATIONS.md).

Configure Supabase Auth site URL and redirect allowlist for the deployed web
origin and `pocketwise://auth` (including recovery query URLs used by the app).
The client supports PKCE confirmation/reset callbacks and password recovery.
Use an installed development/native build with the pocketwise scheme to verify
native links; Expo Go is not evidence that production deep links work. Configure
and test email delivery separately. No production email/device verification was
performed in this workspace.

## Actual feature status

- Transaction CRUD, monthly reports, period category budgets and zero-limit alerts.
- Bill edit/delete and monthly paid occurrence history; subscription calendar
  projections include every weekly renewal.
- Savings goals with opening balances and contribution/withdrawal reconciliation.
- Personal debt tracking, a rules-based coach, and explicitly labeled budget
  estimates with commitment assumptions. No bank-balance or collaboration claim.
- Confirmed cloud writes, retryable failed loads, per-account caches, demo isolation,
  revision conflicts, database deletion tombstones and lifecycle refresh.
- Atomic, idempotent bill payments with optional expense recording; tracker-only
  paid markers remain available without adding transactions.
- Versioned JSON backup and transaction CSV export; native exports share files.
- Account deletion, recovery UI, error boundary and bounded redacted diagnostics.

Authenticated offline edits are disabled; load/reload must succeed before editing.
Import and reminders are unavailable. Purchases are disabled until real billing
and trusted server entitlement verification exist. This is not yet a verified
production release: [verification and remaining blockers](docs/VERIFICATION.md).

## Checks

```powershell
npm run lint -- --max-warnings 0
npm run typecheck
npm run types:database:check
npm test
npm run test:database
npm run test:legacy
npx expo-doctor
npm run export
npm run export:demo
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs lint, application-wide strict types, generated schema drift,
Jest, disposable database and legacy migration checks, and demo three-platform
exports. Browser tests separately use `dist-demo` and a local
loopback server; on Windows they use installed Edge if available. CI also runs
Doctor, browser journeys and timezone regression tests. Exporting bundles does
not verify native runtime behavior or store distribution.

## Documentation

- [Baseline audit and acceptance criteria](docs/AUDIT.md)
- [Architecture and concurrency policy](docs/ARCHITECTURE.md)
- [Financial definitions and rounding/date conventions](docs/FINANCIAL_ASSUMPTIONS.md)
- [Forward migrations and recovery](docs/MIGRATIONS.md)
- [Checks, phase report, performance and blockers](docs/VERIFICATION.md)
- [Isolated authenticated test execution](docs/AUTHENTICATED_TESTS.md)
- [Dependency findings and remediation](docs/DEPENDENCIES.md)
- [Issue-by-issue upgrade evidence](docs/UPGRADE_EVIDENCE.md)
- [Accessibility and native device QA](docs/ACCESSIBILITY_QA.md)

All application screens, providers, adapters, navigation and shared components
are covered by strict TypeScript. Database types are reproduced from actual
migrations in disposable PostgreSQL. The Expo stack and vendored
URI decoder are preserved. Authenticated records synchronize with Supabase;
there are no analytics or advertising integrations.

## Browser examples

[390px goals form](docs/screenshots/goal-390.png),
[360px large amount form](docs/screenshots/transaction-360.png),
[1440px dashboard](docs/screenshots/dashboard-1440.png).
