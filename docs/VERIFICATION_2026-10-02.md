# Upgrade verification and phase report — 2026-10-02

Baseline commit: `608dfd8d6d74cf2cd08d88de2f5562d47152e83e`.
Environment: Windows 10.0.26300, Node 22.21.0, npm 10.9.4, Ryzen 5 5600X,
headless installed Edge 154.0.4258.53. No production writes or publishing.

## Phases

| Phase | Change and reason | Evidence | Migration implication / remaining work |
| --- | --- | --- | --- |
| Baseline | Read screens, contexts, services, schema, tests, config and vendor; mapped ownership and prioritized risks | Baseline lint passed; 4 suites/16 tests passed; configured exports passed; Doctor 20/21 | Audit distinguishes review risks from deterministic arithmetic; no incident claims |
| Isolation and synchronization | Keyed account lifetimes, scoped caches, explicit confirmed record mutations, stale-request guards, recovery/retry and revision conflicts | Store/cloud/cache and mounted provider tests; two-user SQL checks | Forward revision/owner migrations required; old writers intentionally rejected; live concurrent devices unverified |
| Financial rules and management | Typed cent arithmetic, anchored UTC recurrence, commitment estimate, currency lock, bill occurrence history/CRUD, period budgets, goal reconciliation | Domain tests across four timezones; decimal and reconciliation SQL checks | Preserve records, infer legacy opening balances, recover only known paid month; legacy inconsistencies need review |
| UX and delivery | Await confirmed saves, accessible controls, exports, recovery routing, diagnostics, disabled unavailable capabilities, CI and measurements | Component tests, 10 browser journeys, screenshots at four widths, final builds | Native email/share/accessibility checks outstanding; no paid entitlement or reminder implementation |

## Checks actually run

- Installation: sandbox lifecycle spawn EPERM, then approved `npm ci` completed.
- `npm run lint -- --max-warnings 0`: passed.
- `npm run typecheck`: passed for the strict TS boundary; JS is not fully checked.
- `npm test`: 14 suites, 42 tests passed. Covers A → logout → B and demo in
  mounted providers, late responses, interrupted writes, failed load/delete,
  duplicate suppression, reload reconciliation, StrictMode, row pagination,
  one-row writes, forms retaining values and contribution/occurrence arithmetic.
- `npm run test:database`: passed actual migrations in disposable PGlite:
  anonymous/two-user RLS, reassignment denial, revisions, stale writer denial,
  currency/entitlement protections, decimal boundaries, reconciliation,
  aggregates, deletion tombstones and account cascades. Modeled roles are not
  live Supabase sessions. No production SQL was executed.
- Domain regressions under UTC, Europe/Berlin, America/Los_Angeles and
  Pacific/Kiritimati: passed (7 tests per run).
- Expo Doctor: 21/21 after compatible Expo/Metro SDK patches.
- Configured and environment-free demo production exports: web, Android, iOS
  passed. The export script clears Metro cache to avoid stale environment inlining;
  final configured and demo builds are run sequentially.
  Checked bundle contents without logging credentials: configured URL present in
  configured web output, absent from the demo web output.
- Playwright: 10/10 passed. Demo transaction create/edit/delete, reload persistence,
  currency lock, JSON/CSV downloads, reachable screen navigation at
  360/390/768/1440px, no horizontal document overflow, and a 10,000-row journey.
  Screen capture includes long descriptions and a large amount input. This is
  browser demo QA, not authenticated cloud E2E or exhaustive accessibility QA.
- CI workflow added, not executed remotely in this workspace.

## Performance

See [CPU measurements](performance.json) and [browser measurements](browser-performance.json).
CPU benchmark uses mocked I/O, five warmups and 25 samples; browser uses synthetic
demo data and a local production export. These are reproducible desktop samples,
not phone timings or real network latency.

At 10,000 transactions, a one-record edit serializes 134 bytes and sends one
cloud request, versus 1,368,891 bytes for a whole collection serialization.
Single-pass integer totals reduced the earlier CPU median from 12.476ms to about
7ms. Activity renders a small virtualized window, not 10,000 DOM rows. Cloud
history loading still requires one request per 500 records, plus feature/settings
reads; cold-load scalability and report aggregation integration remain work.

## Release blockers and deliberate limitations

Live Supabase HTTP RLS/RPC tests, true expired/refresh sessions, SMTP confirmation
and reset links, native session persistence and auth deletion must be rehearsed
with dedicated accounts. Local tests model session boundaries and SQL roles;
they do not prove end-to-end provider behavior or multi-device concurrency.

Android/iOS runtime, safe areas, keyboard avoidance, native file sharing,
screen readers, focus restoration, large text and permission flows remain
unverified without devices. Reset recovery and some modals are not part of the
four-width screenshot traversal. Dense datasets beyond transactions and all
empty-state combinations need further QA.

Strict TS migration is incremental; cloud JS adapters and screen/context props
still need conversion. Reports use fully paginated client history, not the typed
server aggregate adapter, and concurrent multi-page reads are eventually
consistent. No automatic payment-to-transaction linking, multi-row import,
offline editing queue, reminders, real split collaboration or purchases exists.
Unavailable controls and financial assumptions state those limits explicitly.

`npm audit` still reports four high vulnerabilities in the node-forge 1.4.0
Expo tooling chain. A targeted compatible brace-expansion patch removed one
earlier high finding. The available audit fix suggested downgrading Expo to 44;
that was not applied. Resolve/reassess the tooling advisories before signing or
release. The UUID override and linear vendored URI decoder were retained and
the latter regression-tested with malformed input.

This work is a tested reliability upgrade, not a claim that the entire requested
professional release is complete. Deployment requires the migration rehearsal,
remaining authenticated/native checks and a decision on toolchain advisories.
