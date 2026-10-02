# Financial assumptions

Amounts enter through a strict decimal parser with at most two fractional digits.
Domain calculations use integer minor units and deliberate rounding. Database
adapters preserve decimal amounts; constraints reject excess precision and values
above 9,999,999,999.99. This uniform two-decimal policy also applies to HUF.
Transactions, contributions, bills, subscriptions and debts require positive
amounts. Budgets and opening balances may be zero. Positive spending against a
zero category budget is over budget.

Each account has one currency (EUR/USD/GBP/HUF). Once financial records exist,
currency is locked in both app and database; no historical conversion is implied.
Budgets are spending plans, not money held in an account. Period overrides use
YYYY-MM; unconfigured months use the default plan. Historical plans before this
upgrade cannot be reconstructed from a single previous settings value.

Monthly net is recorded income minus recorded expenses for the month. It is not
available cash: there is no bank balance, starting cash ledger or bank connection.
The dashboard budget estimate deducts recorded monthly expenses, unpaid bill
occurrences, projected subscription renewals through month end, and open debts
the user owes. Its horizon is at most seven days and never exceeds the remaining
month. Negative remainders yield zero. Savings are tracked separately, not
automatically deducted from transaction totals or this estimate.

Commitments are projections, not transactions. Marking a bill paid or a debt
settled does not create an expense; record an actual payment once, then update
the tracker. Subscription renewals require advancing their next billing date
after payment. Trackers can describe the same obligation; the app does not
guess matches and reserves separate trackers separately. The estimate exposes
these assumptions and must never be presented as verified available cash.

Bills preserve per-month payment history including the amount when marked paid;
unmarking the selected occurrence removes that payment marker. Legacy paidMonth
provides only one known occurrence, not evidence of earlier payments. Editing a
bill does not rewrite recorded payment amounts. Splits are personal debt tracking,
not collaboration or a money-transfer service.

Goal saved = immutable starting balance + deposits − withdrawals. Starting saved
is distinct from contribution history. Excessive withdrawal is rejected rather
than clamped; saving beyond the target is permitted. Contributions do not create
bank transactions. Legacy inferred opening balances preserve totals, even when
old activity implies an inconsistent negative opening balance; recovery requires
review rather than deleting activity or inventing money.

Dates follow UTC civil days; date-only inputs use UTC noon, display uses UTC, and
month grouping uses UTC. Existing timestamps are preserved. A timestamp near a
local timezone boundary may therefore group differently from a previous local
display. Weekly projections enumerate every seven-day occurrence. Monthly and
yearly renewals clamp to the last valid day while retaining the original anchor:
January 31 returns to March 31; February 29 returns in the next leap year.
Month arithmetic starts on day one. DST does not change civil-day arithmetic.
Monthly equivalents for weekly subscriptions use 52/12 and are approximate;
calendar obligations use actual occurrences instead. The coach uses local rules
and reports insufficient data with fewer than three current-month transactions.
