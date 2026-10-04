# Accessibility and responsive verification

The automated browser sweep in `e2e/screens.spec.js` checks 360, 390, 768 and
1440px viewports, document overflow, runtime errors, and WCAG 2 A/AA plus 2.1
A/AA rules supported by axe. It captures normal and 24px text versions of each
reachable demo screen, new-record form, existing-record editor and modal.
Screenshots and per-screen violation data are retained in the Playwright report.
It waits for modal animations before checking their accessible tree.

Coverage includes login/register, dashboard, Activity/search, budgets/bills,
reports, profile, student hub, calendar, personal debts, coach, goals,
subscriptions, unavailable billing preview, privacy/export, all five record
forms, category limits, profile editing, and goal withdrawals. Error recovery
is exercised by corrupting and repairing a test-only demo cache while preserving
the draft. A 10,000-transaction case verifies bounded Activity rendering and a
confirmed local mutation. Thirty long-content records per bill/goal/subscription/
debt tracker are inspected at each width with large text. Recovery-form screenshots
and axe checks are part of
the isolated authenticated browser suite and remain unverified without credentials.

Implemented fixes include minimum 12px application typography, named icon
actions and switches, checked-state output on bill checkboxes, darker badge and
debt text, real button semantics for month navigation, explicit withdrawal
cancel, a bounded navigation/error-banner layout, scalable tab height, wrapping
calendar event details and bill amounts below descriptions, and restoration of web focus
after modal cancel/Escape. Regression assertions cover category, profile and
withdrawal modal focus. Native focus restoration still requires screen readers.
The keyboard journey uses Enter/Space to activate controls, types a transaction,
saves it, navigates tabs and cycles Tab within a modal before Escape restoration.
The corrupt-cache error state also receives an axe check.

## Manual review to retain

Automated zero violations do not establish WCAG compliance. Review the screenshot
matrix for text clipping, overlapping inner controls and reading order; document
overflow alone cannot detect those defects. Inspect each screen using Tab,
Shift+Tab, Enter, Space and Escape: focus must remain visible, modals must contain
focus while open, and closing them must return it to the trigger. Check 200%
browser zoom, system text scaling and long translated labels. Confirm no
information depends solely on color, especially calendar dots and financial
warnings. Check empty/loading/offline/conflict/deleted-record states with an
isolated authenticated account. Keep the recovery and account-deletion paths in
the same review. Dense non-transaction datasets need review beyond the fixture
matrix; there is no claim of exhaustive combinations or all assistive technologies.

## Device-dependent checks — unavailable here

No Android/iOS emulator or attached runtime was available; native bundle exports
are build evidence only. On each target OS record device/version and observed
result for:

- Keyboard avoidance, decimal entry and multiline notes on every form/modal;
  content must remain reachable with keyboard and enlarged text.
- Insets and safe areas with notches, rotation, bottom bars and software keyboards.
- Android system back and iOS navigation gestures, including modal cancellation
  and retained drafts after failed saves.
- Cold/warm confirmation and recovery links, expiry, token reuse and session
  persistence; use dedicated test accounts and actual email delivery.
- JSON/CSV native file sharing and cancellation without exposing another account.
- TalkBack/VoiceOver labels, checked/pending/disabled/error state announcements,
  modal reading order and focus return.
- Two-device background/resume, pending mutations and refresh failure using the
  scenarios in [authenticated verification](AUTHENTICATED_TESTS.md).

These checks remain release dependencies. Record results in VERIFICATION.md;
do not mark them complete from Expo export, DOM axe, or simulated AppState tests.
