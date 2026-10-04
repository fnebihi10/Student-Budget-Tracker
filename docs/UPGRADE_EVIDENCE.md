# Pocketwise upgrade evidence — 2026-10-04

The existing reliability implementation was preserved and extended. Expo SDK 57,
React Native, React Navigation and Supabase remain. No production database,
production account, publishing or billing change was made. The earlier review
is retained in [the October 2 report](VERIFICATION_2026-10-02.md).

## Implemented phases and unresolved dependencies

| Concrete problem | Implementation | Regression / procedure | Observed result | Remaining dependency |
| --- | --- | --- | --- | --- |
| JS screens/providers/adapters escaped strict type checking | All application code migrated to TS/TSX, typed navigation/context commands, actual typed Supabase client, runtime JSON/row validation | `npm run typecheck`; decoder tests; no application any/suppression/exclusion | Application-wide strict check passes | Live malformed legacy rows may need audited repair; validation preserves and rejects them rather than silently deleting data |
| Database contracts were hand-maintained and incomplete | Catalog generation from every actual migration in locked disposable PGlite; generated scalar/nullability/check-enum contracts and RPC signatures | `npm run types:database:check`; CI drift gate | Generated types match the migrated catalog | PGlite models auth bootstrap, not the hosted Auth service; relationships are not generated for unused joined queries |
| Backgrounded devices retained stale financial snapshots | AppState resume and web visibility/focus listeners; 250ms burst coalescing; one load per store; one deferred reconciliation during writes; scope/generation invalidation | Lifecycle/store tests for remote changes, overlapping events, pending writes, rejected refresh and account changes | All local regressions pass | Physical devices and real network/session timing unverified; no realtime push/polling or multi-page transactional snapshot |
| Refreshed rows could be overwritten by an older open form, or an old delete confirmation | Opening revision on record/plan/profile editors and delete confirmations; missing-row rejection; visible draft/conflict notice and refresh/reload controls | `editConflict.test.ts`, store/cloud tests, isolated two-device browser scenario | Local guards pass; demo recovery retains entered values | Actual two-device Auth/PostgREST scenario awaits dedicated credentials; drafts remain memory-only and are discarded on logout/restart |
| Bill payment could require separate expense/history writes and duplicate on retry | Atomic `record_bill_payment` RPC; immutable owner receipts; stable operation UUID; owner/bill/period uniqueness; locks; optional expense; replay returns current rows and replaces the synthetic client expense | PostgreSQL replay/new IDs/intent/stale revision/rollback/legacy-paid/unmarked/edited-or-deleted ledger regressions; adapter deduplication; browser history/tracker-only flow | Local SQL and demo workflows pass; no double expense in replay tests | Real RPC concurrency and lost HTTP responses unverified until isolated run; migration must precede new authenticated writes |
| A retained withdrawal could be submitted again after an ambiguous response | Stable goal activity intent/date/opening revision; recorded-ID and refreshed-revision checks; balance/history remain one row write | Goal intent and withdrawal domain regressions; browser withdrawal/history | Local tests pass; replay is rejected for review | Intent is per open dialog; user must review history before opening a new action. No bank transaction is created |
| Commitments, debts, subscriptions and transactions could be confused | Explicit tracker-only versus ledger wording; bills/subscriptions reserve planned obligations; goal and settlement actions remain personal tracking | Financial assumptions; budgets/subscription/withdrawal/settlement browser journeys | Demo workflows pass | No automatic cross-tracker or bank matching; unmarking a bill does not remove an existing expense |
| Reports depended entirely on paginated client data | Selected-month server `monthly_totals` RPC with validated values, cancellation and stale-response rejection; labelled local-history fallback; deterministic UUID pagination retained | Report hook race/failure/refresh regression; pagination >1,000 rows; SQL aggregates; 10,000-row browser case | Local tests pass and history remains complete | Aggregate and history are independently read and can briefly differ during concurrent changes; real RPC response remains unverified |
| Real Auth/RLS/RPC behavior lacked a runnable isolated harness | Guarded dedicated-project configuration, random fixtures/cleanup, real Auth/PostgREST/RPC runner, authenticated browser suite and manual CI workflow | [Exact execution instructions](AUTHENTICATED_TESTS.md); runner without credentials; syntax checks | Missing configuration exits before network: **UNVERIFIED**, not mocked equivalence | Dedicated isolated project/key/ref/service key, redirect allowlist and short JWT expiry; SMTP/native links require separate rehearsal |
| Migration checks omitted representative inconsistent legacy history | Original schema populated with paid bills and both negative inferred/ordinary goal openings, then every forward migration applied | `npm run test:legacy`; full migration SQL suite | Totals, activity and only the known paid occurrence preserved | Hosted Supabase migration compatibility still unverified; invalid legacy JSON requires reviewed repair |
| Small text, unnamed actions, incorrect month role, checkbox state and modal focus impaired access | Minimum 12px text, contrast fixes, names/states, month buttons, withdrawal cancel, web focus return, bounded error banner, large-text calendar/list/navigation layout | Four-width axe/screenshot suite, Escape/cancel focus assertions, dense fixtures and tab-label clipping check | Expanded matrix recorded in VERIFICATION.md | Screen-reader/manual zoom/reading order and native runtime remain separate checks; recovery screen needs isolated credentials |
| Previous audit count and automatic fix recommendation were misleading | Live online audit, upstream advisory/package/version investigation, preserved supported Expo stack and lockfile; no incompatible downgrade/force override | `npm ci`, Expo Doctor, fresh audit JSON, exports and browser regressions | Clean install; Doctor 21/21; **46 high entries from two underlying advisories remain** | node-forge 1.4.0 and braces 3.0.3 have no published patch at check; [precise exposure/remediation](DEPENDENCIES.md) |
| Release evidence conflated CPU, mock I/O, browser, device and cloud timing | Separate CPU/mocked-I/O artifact and real local browser measurements; expanded demo/authenticated journeys and CI artifacts | `npm run profile:finance`, browser 10,000-row case, quality and isolated CI workflows | CPU artifact recorded; browser sample recorded in VERIFICATION.md | No actual Supabase network or native performance measurement; remote CI workflows not run here |

## Consistency contract

Within each account-scoped feature store, reads coalesce, writes serialize and
publish only after confirmation, resume during a write schedules one later read,
and invalidated account generations never publish late responses. Failed reads
retain the last confirmed snapshot but disable edits. A successful reload enables
edits. Opening revisions protect drafts from a newer refreshed row; database
revision predicates protect the gap between refresh and write. Deletion tombstones
prevent stale insert/upsert resurrection. A failure with unknown outcome requires
reload and history review before another financial action.

Resume/focus provides eventual refresh at the next successful request, not a
continuous synchronization guarantee. Each feature and each paginated request is
independent; a refresh is not a transactionally consistent snapshot across features
or pages. There is no offline edit queue. Repeated events coalesce while a load
is pending; distinct later focus/resume events intentionally request fresh data.
See [architecture](ARCHITECTURE.md) and [financial assumptions](FINANCIAL_ASSUMPTIONS.md).

## Release boundary

The source changes, local checks and isolated harness are reviewable. Native
runtime, live isolated Supabase/Auth/email verification and unresolved tooling
advisories are material release dependencies. A passing local suite is not a
claim of a production-ready release or an independent numerical rating.
