import { sumMoney } from '../domain/finance';
import type { Goal } from '../domain/finance';
type GoalProjection = Pick<Goal, 'target' | 'saved'> & { deadline?: string | null };

export const goalProgress = (goal: GoalProjection) =>
  goal.target > 0 ? Math.min((Number(goal.saved) / Number(goal.target)) * 100, 100) : 0;

export const goalRemaining = (goal: GoalProjection) =>
  Math.max(Number(goal.target) - Number(goal.saved), 0);

export const goalDaysLeft = (goal: GoalProjection) => {
  if (!goal.deadline) return null;
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const deadline = new Date(goal.deadline);
  deadline.setUTCHours(12, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
};

export const monthlyGoalPace = (goal: GoalProjection) => {
  const days = goalDaysLeft(goal);
  const remaining = goalRemaining(goal);
  if (remaining <= 0) return 0;
  if (days == null || days <= 0) return remaining;
  return (remaining / days) * 30.44;
};

export const goalTotals = (goals: readonly Pick<Goal, 'saved' | 'target'>[]) => ({
  saved: sumMoney(goals.map((goal) => Number(goal.saved || 0))),
  target: sumMoney(goals.map((goal) => Number(goal.target || 0))),
});
