export const goalProgress = (goal) =>
  goal.target > 0 ? Math.min((Number(goal.saved) / Number(goal.target)) * 100, 100) : 0;

export const goalRemaining = (goal) =>
  Math.max(Number(goal.target) - Number(goal.saved), 0);

export const goalDaysLeft = (goal) => {
  if (!goal.deadline) return null;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const deadline = new Date(goal.deadline);
  deadline.setHours(12, 0, 0, 0);
  return Math.ceil((deadline - today) / 86400000);
};

export const monthlyGoalPace = (goal) => {
  const days = goalDaysLeft(goal);
  const remaining = goalRemaining(goal);
  if (remaining <= 0) return 0;
  if (days == null || days <= 0) return remaining;
  return (remaining / days) * 30.44;
};

export const goalTotals = (goals) =>
  goals.reduce(
    (totals, goal) => ({
      saved: totals.saved + Number(goal.saved || 0),
      target: totals.target + Number(goal.target || 0),
    }),
    { saved: 0, target: 0 }
  );
