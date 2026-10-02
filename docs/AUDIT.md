# Pocketwise upgrade audit — 2026-10-02

Baseline: `608dfd8d6d74cf2cd08d88de2f5562d47152e83e`, Node 22.21.0,
npm 10.9.4, Windows. No repository AGENTS.md found. `RaportoDemo/` is
pre-existing untracked user content and is outside this work.

## Ownership and dependency map

`App.js`: Auth → Budget → Subscriptions → Goals → Splits → Navigation.
`AuthContext.js`: Supabase persisted session, signup metadata and shared pending
onboarding key; demo boolean selects the authenticated navigation tree.
`AppNavigator.js`: five tabs and stack modals; data-loading gates and error banner.
`cloudData.js`: table reads, collection upserts, deletes and account-deletion RPC.
Each finance context independently hydrates a global AsyncStorage key and then
fetches cloud data. Budget owns profile/settings/transactions/bills. Other
providers own goals, personal debts and subscription trackers. Dashboard, coach,
calendar and reports combine those providers; none has a bank balance source.
Schema has owner RLS with USING and WITH CHECK; all financial rows cascade from
auth.users. Settings plan/status are user-writable and cannot prove entitlement.

## Prioritized findings

The baseline review risks below are deterministic code paths, but are not
claimed as observed production incidents. Regression tests added during the
upgrade exercise the replacement with mocked storage/network. Live two-user
Supabase behavior remains a separate verification requirement.

| Priority / evidence | Files and impact | Reproduction | Acceptance |
| --- | --- | --- | --- |
| P0 / review risk | All four `src/context/*Context.js`: global cache exposes another account's records; late promises restore old data | Login A, delay fetch, logout, login B; restart with global cache and fail cloud read | Never display A in B/demo; no writes from invalidated scopes |
| P0 / review risk | Same contexts + `cloudData.js`: debounced whole-history upserts can resurrect deletes and overwrite concurrent changes | Delay collection sync containing X, delete X, finish sync | Only explicit changed-row writes; edits cannot recreate deleted rows; confirmed deletes remain absent |
| P0 / review risk | Initial-load failure sets user ref and prevents retry; local edits accepted without successful load | Fail initial cloud read, recover connection, submit edit | Visible retry; cached reads clearly unverified; block writes until verified load |
| P1 / review risk | `cloudData.js:fetchRows`: unpaginated API read truncates history/aggregates at server cap | >1000 records, compare cloud count to report | Read every page or compute complete server aggregates |
| P1 / deterministic arithmetic | `DashboardScreen.js`: budget remainder ignores obligations and multiplies by 7 even with one day left | Unpaid rent + Oct 31 | Label budget estimate; reserve commitments; cap horizon; expose assumptions |
| P1 / review risk | `ProfileScreen.js`, `BudgetContext.js`: currency switch relabels all historical amounts | Record EUR expense, switch USD | Currency locked once financial records exist, enforced in database |
| P1 / deterministic arithmetic | `ReportScreen.js`: setMonth on March 31 skips February | Evaluate prior months on March 31 | Anchor month arithmetic on first day |
| P1 / review risk | `MoneyCalendarScreen.js`, `subscriptions.js`: only one weekly renewal; leap-day yearly recurrence drifts | Weekly subscription across five weeks; Feb 29 renewal | Enumerate every occurrence; document date/zone policy |
| P1 / review risk | Bills store only `paidMonth`; no edit/delete UI or payment history | Mark paid in successive months | Preserve occurrences; explicit management; payments distinct from transactions |
| P1 / review risk | `GoalsContext.js`: starting saved absent from activity; withdrawals clamp while recording full amount | Start at 100; withdraw 150 | Reconcile starting balance + history; reject excessive withdrawal |
| P1 / review risk | Native auth lacks link/reset routing; `supabase.js` throws at import without env | Launch env-free demo; open reset link | Env-free demo works; native/web confirmation and recovery tested |
| P2 / review risk | `BudgetCard.js`: positive spend with zero limit looks healthy | Set limit 0, spend 10 | Show over-budget state |
| P2 / review risk | Save forms navigate/haptic before cloud success; no duplicate guards | Fail network after save, double click | Keep form on failure; confirmed success only; pending controls |
| P2 / review risk | `PrivacyScreen.js`: native export shares JSON text; no CSV/version; `StudentHubScreen.js` says cloud debts local | Native export; read privacy copy | Real files; versioned JSON + CSV; accurate synchronization statements |
| P2 / unverified | Sparse accessibility labels and viewport/native QA; no component/auth/DB/E2E tests or CI | Keyboard + large text + 360/390/768/1440 views | Core journeys accessible and tested on supported targets |
| P2 / unverified | No measured 10k performance, strict types, error boundary or redacted diagnostics | Large histories; rendering error | Measurements, incremental strict TS, boundary, CI |

## Baseline checks

Installation: initial sandbox `npm ci` failed with lifecycle spawn EPERM; approved
retry completed (987 packages). Existing overrides and the linear vendored URI
decoder were inspected; no blind dependency upgrade. Lockfile preserved.
Lint, Jest, Expo Doctor and all-platform export were started against baseline;
results are recorded in `docs/VERIFICATION.md` once complete.

No production DB changes, external publishing or billing activation are authorized.
Public client config exists locally; it is not permission to mutate its database.
Native device testing and authenticated cloud journeys require dedicated test
accounts/devices. Export success is not runtime or release readiness.
