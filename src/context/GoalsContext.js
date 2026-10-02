import { useConfirmedStore } from './useConfirmedStore';
import { contribute, openingBalance, positiveMoney, parseMinor, assertText, assertDate } from '../domain/finance';
import React, {
  createContext,
  useCallback,
  useMemo,
} from "react";
import {
  fetchRows,
  goalFromRow,
  goalToRow,
  newId,
  persistCollection,
} from "../services/cloudData";


const futureDate = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString();
};

const demoGoals = [
  {
    id: "demo-goal-emergency",
    templateId: "emergency",
    name: "Emergency cushion",
    target: 500,
    saved: 215,
    deadline: futureDate(120),
    icon: "shield-checkmark",
    color: "#4FA982",
    notes: "For unexpected student costs",
    createdAt: new Date().toISOString(),
    activity: [
      { id: "goal-demo-1", amount: 75, note: "Campus job", date: futureDate(-14) },
      { id: "goal-demo-2", amount: 40, note: "Skipped takeout", date: futureDate(-6) },
      { id: "goal-demo-3", amount: 100, note: "Monthly transfer", date: futureDate(-1) },
    ],
  },
  {
    id: "demo-goal-trip",
    templateId: "travel",
    name: "Summer city trip",
    target: 650,
    saved: 180,
    deadline: futureDate(210),
    icon: "airplane",
    color: "#E58C5B",
    notes: "Train, hostel, and spending money",
    createdAt: new Date().toISOString(),
    activity: [
      { id: "goal-demo-4", amount: 180, note: "Started the fund", date: futureDate(-22) },
    ],
  },
];

export const GoalsContext = createContext(null);

export function GoalsProvider({ children }) {
  const store = useConfirmedStore('goals', [], demoGoals,
    async (user) => (await fetchRows('goals', user.id)).map(goalFromRow),
    (userId, before, after) => persistCollection('goals', userId, before, after, goalToRow));
  const goals = store.data;
  const isLoadingGoals = store.status === 'loading' && !store.initialized;
  const goalsStorageError = store.error;
  const setGoals = store.mutate;

  const saveGoal = useCallback((goal) => {
    return setGoals((current) => {
      const target = positiveMoney(goal.target);
      const saved = parseMinor(goal.saved ?? 0) / 100;
      assertText(goal.name, 80, 'Goal name');
      if (goal.deadline) assertDate(goal.deadline);
      if ((goal.notes || '').length > 500) throw new Error('Notes must be at most 500 characters.');
      if (goal.id) {
        return current.map((item) =>
          item.id === goal.id ? { ...item, ...goal, target, saved: item.saved, startingBalance: openingBalance(item), activity: item.activity } : item
        );
      }
      return [
        {
          ...goal,
          id: newId(),
          target,
          saved,
          startingBalance: saved,
          createdAt: new Date().toISOString(),
          activity: [],
        },
        ...current,
      ];
    });
  }, [setGoals]);

  const addGoalActivity = useCallback((id, amount, note = "") => {
    return setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== id) return goal;
        return contribute(goal, {
              id: newId(),
              amount: parseMinor(amount, true) / 100,
              note: note.trim(),
              date: new Date().toISOString(),
        });
      })
    );
  }, [setGoals]);

  const deleteGoal = useCallback((id) =>
    setGoals((current) => current.filter((item) => item.id !== id)), [setGoals]);

  const resetGoals = useCallback(() => setGoals(() => []), [setGoals]);

  const value = useMemo(
    () => ({
      syncStatus: store.status,
      retrySync: store.retry,
      goals,
      isLoadingGoals,
      goalsStorageError,
      saveGoal,
      addGoalActivity,
      deleteGoal,
      resetGoals,
    }),
    [
      store.status, store.retry,
      goals,
      isLoadingGoals,
      goalsStorageError,
      saveGoal,
      addGoalActivity,
      deleteGoal,
      resetGoals,
    ]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}
