# Verification follow-up and release decision - 2026-10-04

**Decision: hold release.** No waiver or risk acceptance is recorded for the
remaining hosted-account, native-runtime or tooling-advisory checks. This decision
does not prevent reviewing or merging source changes. No deployment, production
database change, billing activation or signing operation was performed.

| Problem | Implementation / procedure | Observed result | Remaining dependency |
| --- | --- | --- | --- |
| Three timezone test failures; Jest 29 ignored the plural filter flag | Explicit UTC fixtures and ISO assertions in date, subscription and calculation tests; two explicit-offset month-boundary regressions; `npm run test:timezones` runs the full suite in separate processes for all four zones | Reproduced 3 failures before the fix; afterwards 18 suites / 56 tests pass locally and on GitHub in UTC, Berlin, Los Angeles and Kiritimati. Lint passes. [Machine-readable local summary](timezone-verification.json) | None for the reproduced test-contract failures |
| CI timezone filtering was ineffective and failures cancelled other zones | Removed filtering entirely; each zone runs the full application suite. Disabled matrix fail-fast; retained per-zone Jest JSON artifacts even on failure | Local runner produced four reports; all four corrected GitHub jobs succeeded with 56/56 tests | None for the corrected timezone workflow |
| Browser suite result lacked independent CI confirmation | Read completed job metadata and the actual browser log of the cited run | [Verify job](https://github.com/fnebihi10/Student-Budget-Tracker/actions/runs/37201604741/job/111434264932) succeeded; log says `18 passed (2.5m)`. Overall run failed because of the separate timezone job | This confirms demo browser coverage only |
| Hosted Auth/PostgREST/RPC security remains unverified | Existing guarded isolated harness retained; expiry test now fails instead of allowing a green run with skipped expiry. CI preserves integration logs as well as browser artifacts | Missing configuration still exits before network as UNVERIFIED. Local credentials absent; metadata-only isolated-environment lookup returned 404. Harness syntax checked; hosted changes not exercised | Dedicated disposable project, migrations, test credentials, redirect allowlist, short JWT expiry; actual mailbox for delivery. [Exact commands](AUTHENTICATED_TESTS.md) |
| Native exports were mistaken for runtime verification | Retained platform-specific execution procedures below and in [accessibility QA](ACCESSIBILITY_QA.md); no native pass claimed | No adb/emulator/xcrun available; keyboards, insets, back, links, sharing and screen readers remain UNVERIFIED | Android and iOS devices/development builds, isolated accounts and test mailbox |
| 46 high entries propagate from two underlying tooling advisories | Repeated live online audit and registry version queries; retained supported Expo dependencies and reproducible lockfile | 46 high entries remain; latest registry braces 3.0.3 and node-forge 1.4.0 remain affected. No unsupported downgrade or forced override applied | Published compatible fixes, or an explicit accountable release risk decision supported by the exposure assessment. [Advisories and remediation](DEPENDENCIES.md) |

## Confirmed remote result

[Quality run 37202872316](https://github.com/fnebihi10/Student-Budget-Tracker/actions/runs/37202872316)
completed with **success** against code commit
`8c27fa3b7a328a4306386cc70f55a93c9deee1bc`. All five jobs succeeded. The logs confirm
56/56 tests in each timezone and 18/18 browser tests (2.1 minutes). The verify job
also passed clean installation, lint, strict types, database type generation,
migration/legacy checks, Expo Doctor and web/Android/iOS demo exports. Per-zone
JSON and browser artifacts were uploaded. This follow-up documentation records
that tested revision; hosted integration and native runtime were not part of it.

## Required hosted acceptance evidence

Run the commands in AUTHENTICATED_TESTS.md against an explicitly isolated project.
Retain the revision, project reference (no secrets), applied migration names,
Auth redirect/expiry settings, complete integration results, browser traces and
cleanup outcome. A failed, missing or skipped required check is not acceptance.
Admin-generated links do not establish actual email delivery or native links.
Record real two-device background/resume, pending mutation, remote deletion and
revoked refresh scenarios separately from simulated lifecycle tests.

## Required native acceptance evidence

For **Android and iOS separately**, record the commit, device/model, OS, build
identifier, test account isolation, reproduction steps, expected result, actual
result and screenshot/video/log reference for each row below. Status is currently
UNVERIFIED for both platforms; a bundle export cannot change it.

| Procedure | Acceptance condition |
| --- | --- |
| Enter amounts and long notes in every form/modal with enlarged system text and keyboard open | Inputs, errors and Save/Cancel remain readable and reachable; amount entry remains correct |
| Navigate with notch/system bars, rotation and Android back/iOS gestures | Insets protect controls; back/cancel returns correctly and failed-save drafts remain available |
| Open confirmation/recovery email links from cold and running app; retry used/expired links | Correct account/screen; password replacement works; invalid links have useful recovery feedback |
| Export JSON/CSV, invoke sharing, cancel, switch accounts and repeat | Correct file contents; cancellation recovers; no previous-account data exposed |
| Use TalkBack/VoiceOver for forms, tabs, checkboxes, pending/error states and dialogs | Names/states and reading order are clear; actions work; modal dismissal restores focus |
| Background A; change/delete on B; resume A, including during a delayed write and failed refresh | Updated confirmed data appears; pending input survives; stale/deleted edits are rejected; retry works; event bursts do not duplicate loads |

## Advisory decision boundary

Keep build patterns and cryptographic tooling inputs under project control while
the advisories remain open. This limits inspected exposure; it is not proof of
non-exploitability or acceptance of the vulnerabilities. Release remains on hold
until compatible fixes are verified or the repository owner records a dated,
scoped risk acceptance naming both advisories, affected pipelines, input controls,
review owner and remediation deadline. No such acceptance is inferred from a
passing CI job or from authorization to push commits.
