# Verification — 2026-10-04

Pocketwise's upgrade includes strict TypeScript throughout the application,
lifecycle-aware financial refresh, revision-aware drafts/deletions, atomic
idempotent bill payments, guarded goal withdrawals, server report aggregates,
legacy migration rehearsal, accessibility fixes and isolated authenticated test
harnesses. [Issue-by-issue implementation and evidence](UPGRADE_EVIDENCE.md)
records concrete problems, changes, regressions, results and external dependencies.
The [previous report](VERIFICATION_2026-10-02.md) is historical evidence.
The [verification follow-up and release decision](RELEASE_DECISION.md) records
the reproduced timezone CI failure, implemented correction, independently read
browser CI result, and explicit hold on release pending material external checks.

No production accounts/data/databases were used for these tests. No publishing
or billing change was made. Existing user records and quarantined legacy caches
were preserved. New SQL was exercised only in disposable local PostgreSQL.

## Observed local results

Environment: Windows 10.0.26300, Node 22.21.0, npm 10.9.4, Ryzen 5 5600X,
installed headless Edge 154.0.4258.53; production-mode local Expo demo export.

| Check | Observed result |
| --- | --- |
| `npm ci --offline=false --prefer-online` | Passed using the committed lockfile; 46 high dependency entries remain |
| `npm run check` | Passed: lint with zero warnings, application-wide strict types, generated catalog drift, Jest, disposable migration checks, legacy rehearsal and web/Android/iOS demo exports |
| Jest | 18 suites / **56 tests passed in each of four timezones** using `npm run test:timezones`; includes two new UTC month-boundary regressions. Before correction, Kiritimati reproduced three older fixture/assertion failures |
| `npm run test:database` | All actual migrations passed in disposable PGlite with modeled Auth roles; RLS, ownership/revisions, tombstones, account cascade, aggregate rules and payment RPC rollback/replay/intent/current-or-deleted ledger behavior |
| `npm run test:legacy` | Original schema plus inconsistent goal histories/negative inferred openings and paid bills migrated without changing totals/history or inventing older payments |
| `npm run types:database:check` | Generated tables/nullability/check enums/RPC contracts match the migrated catalog |
| Expo Doctor | **21/21 passed** after clean installation; retained supported Expo SDK 57 stack |
| Browser | **18/18 passed** on the final exported application, including four-width axe/large-text/keyboard/clipping checks, dense trackers, financial workflows and the corrected deterministic 10,000-row fixture |
| Integration runner without dedicated credentials | Exits before network with explicit **UNVERIFIED** message; isolated harness syntax checks pass, real Auth/PostgREST/RPC behavior is unverified |
| CI | [Original remote verify job](https://github.com/fnebihi10/Student-Budget-Tracker/actions/runs/37201604741/job/111434264932) passed, including browser log `18 passed (2.5m)`; overall run failed on the timezone job. Corrected full-suite matrix awaits remote confirmation. Isolated authenticated workflow remains unverified |

The browser suite covers transaction CRUD/restart, currency locking and JSON/CSV
exports; budgets, bill paid history/payment versus tracker-only marking;
subscription pause/resume; savings withdrawals and personal debt settlement;
failed-cache recovery with retained drafts; all reachable demo screens/forms/
modals at 360/390/768/1440px; axe rules, normal/24px text captures, no document
overflow, modal keyboard focus containment/return and tab-label vertical clipping. Dense
fixtures have 30 long-content records in each bill/goal/subscription/debt tracker
at each width. A 10,000-transaction case checks actual local browser loading,
cache hydration, confirmed mutation and bounded Activity rendering.

Screenshots/violation attachments and failure traces are in `test-results` and
`playwright-report` (ignored by git, retained by CI). Selected inspected screenshots
are copied to `docs/screenshots`: [360px large-text calendar](screenshots/calendar-large-text-360-20261004.png),
[390px profile modal](screenshots/profile-modal-390-20261004.png),
[768px dashboard](screenshots/dashboard-768-20261004.png), and
[1440px dense goals](screenshots/dense-goals-1440-20261004.png). Snapshot review fixed
calendar event/amount crowding and long bill titles, which document overflow
alone did not detect. See [accessibility and manual requirements](ACCESSIBILITY_QA.md).

## Measurements and scope

[CPU/mocked I/O artifact](performance.json): 10,000 synthetic transactions,
five warmups and 25 samples; integer totals median **6.511ms**, p95 **6.933ms**;
one-row cloud adapter with mocked I/O median **1.007ms**, p95 **1.758ms**.
One edit serializes 134 bytes and one mocked cloud request, versus 1,368,891 bytes
for serializing the entire collection. This is Node CPU/mocked storage/network
evidence, not Supabase latency or native performance. The final sample was run
after bundling completed, before browser tests.

[Browser artifact](browser-performance.json) records the final local browser
sample separately: cold login **207ms**, 10,000-row home hydration **107ms**,
reload/hydration **212ms**, mutation **101ms**, Activity **60ms**, **10 rendered
rows** and **zero cloud requests**. A cold login includes bundle loading; the 10,000-row home
sample includes cache hydration; refresh means a browser reload plus demo cache
hydration, not cloud refresh; mutation includes confirmed local storage and
rendering. Activity verifies a bounded virtualized window. These are single
representative desktop samples without a browser HTTP-cache purge, not
statistical latency guarantees, phone timing or real Supabase network measurements.

## Material remaining verification

- **Live isolated Supabase:** real Auth signup/confirmation, two-user HTTP RLS,
  PostgREST/RPC concurrency, JWT expiry/refresh/revocation, recovery, deletion and
  hosted migration compatibility remain unverified. The complete fixtures,
  guards, commands and CI configuration are in
  [authenticated execution](AUTHENTICATED_TESTS.md). Expiry now fails verification if
  the test project token lives beyond the configured wait; configure short
  expiry. Admin-generated Auth links do not prove SMTP delivery or native PKCE.
- **Native devices and assistive technology:** Android/iOS runtime, keyboards,
  insets, system back/gestures, cold/warm deep links, file sharing, TalkBack and
  VoiceOver unavailable. No adb/emulator/xcrun runtime was found. Native bundle
  exports prove bundling only. Manual browser zoom, reading order and complete
  screen-reader behavior remain checks beyond axe and screenshots.
- **Dependencies:** live audit reports 46 high entries arising from two unresolved
  advisories, node-forge 1.4.0 and braces 3.0.3. Registry checks still show those
  as latest with no published patch. No incompatible Expo downgrade was applied.
  [Exact exposure and remediation](DEPENDENCIES.md) includes primary advisory
  links and the raw audit, distinguishing tool inputs from financial inputs.
- **Consistency/performance limits:** no realtime push, offline editing queue or
  transactional snapshot across features/pages; data reconciles on the next
  successful resume/focus/manual read. Server aggregates and history may briefly
  differ under concurrent writes. Actual network and native timings await the
  isolated/device runs. Drafts are memory-only; users review/copy before reopening.

These are material release dependencies. Local passing tests and implemented
harnesses do not establish a production-ready release.
