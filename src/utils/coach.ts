import { categorySpend, getTotals, monthTransactions } from "./calculations";
import { activeSubscriptionTotal } from "./subscriptions";
import { isBillPaidForMonth } from "./dates";
import type { Transaction, Bill, Goal } from '../domain/finance';
import type { Recurrence } from '../domain/calendar';
type HealthInput = {
  transactions: Transaction[]; settings: { monthlyBudget: number };
  bills: Pick<Bill, 'paidMonth' | 'paymentHistory'>[];
  subscriptions: (Recurrence & { amount: number; status: string })[];
  goals: Pick<Goal, 'saved'>[];
};

export const calculateHealth = ({
  transactions,
  settings,
  bills,
  subscriptions,
  goals,
}: HealthInput) => {
  const totals = getTotals(transactions);
  const insufficientData = monthTransactions(transactions).length < 3;
  const budgetRatio = settings.monthlyBudget
    ? totals.expenses / settings.monthlyBudget
    : 0;
  const recurring = activeSubscriptionTotal(subscriptions);
  const recurringRatio = settings.monthlyBudget
    ? recurring / settings.monthlyBudget
    : 0;
  const openBills = bills.filter((bill) => !isBillPaidForMonth(bill)).length;
  const saved = goals.reduce((sum, goal) => sum + Number(goal.saved || 0), 0);

  const planScore =
    budgetRatio <= 0.85 ? 30 : budgetRatio <= 1 ? 22 : budgetRatio <= 1.15 ? 12 : 4;
  const cashScore =
    totals.income === 0 ? 10 : totals.balance >= 0 ? 25 : 5;
  const goalScore = saved > 0 ? 20 : goals.length ? 12 : 5;
  const commitmentScore =
    openBills === 0 && recurringRatio <= 0.15
      ? 15
      : openBills <= 1 && recurringRatio <= 0.25
      ? 10
      : 5;
  const habitScore =
    transactions.length >= 8 ? 10 : transactions.length >= 3 ? 7 : 3;
  const score = Math.round(
    planScore + cashScore + goalScore + commitmentScore + habitScore
  );

  const categories = categorySpend(transactions);
  const topCategory = Object.entries(categories).sort((a, b) => b[1] - a[1])[0];

  return {
    insufficientData,
    score: insufficientData ? 0 : score,
    grade:
      insufficientData ? 'Insufficient data' : score >= 85
        ? "Excellent"
        : score >= 70
        ? "Healthy"
        : score >= 55
        ? "Building"
        : "Needs attention",
    totals,
    budgetRatio,
    recurring,
    recurringRatio,
    openBills,
    topCategory,
    breakdown: [
      { id: "plan", label: "Budget control", score: planScore, max: 30 },
      { id: "cash", label: "Cash flow", score: cashScore, max: 25 },
      { id: "goals", label: "Savings habits", score: goalScore, max: 20 },
      {
        id: "commitments",
        label: "Commitments",
        score: commitmentScore,
        max: 15,
      },
      { id: "habit", label: "Tracking habit", score: habitScore, max: 10 },
    ],
  };
};
