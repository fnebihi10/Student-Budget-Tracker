import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@pocketwise/savings-goals/v1";

const futureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
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
  const [goals, setGoals] = useState([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setGoals(JSON.parse(stored));
      })
      .catch(() => {})
      .finally(() => setIsLoadingGoals(false));
  }, []);

  useEffect(() => {
    if (isLoadingGoals) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals)).catch(() => {});
  }, [goals, isLoadingGoals]);

  const saveGoal = useCallback((goal) => {
    setGoals((current) => {
      if (goal.id) {
        return current.map((item) =>
          item.id === goal.id ? { ...item, ...goal } : item
        );
      }
      return [
        {
          ...goal,
          id: `${Date.now()}-goal`,
          saved: Number(goal.saved) || 0,
          createdAt: new Date().toISOString(),
          activity: [],
        },
        ...current,
      ];
    });
  }, []);

  const addGoalActivity = useCallback((id, amount, note = "") => {
    const numeric = Number(amount);
    if (!numeric) return;
    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== id) return goal;
        const nextSaved = Math.max(0, Number(goal.saved) + numeric);
        return {
          ...goal,
          saved: nextSaved,
          activity: [
            {
              id: `${Date.now()}-goal-activity`,
              amount: numeric,
              note: note.trim(),
              date: new Date().toISOString(),
            },
            ...(goal.activity || []),
          ],
        };
      })
    );
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals((current) => current.filter((goal) => goal.id !== id));
  }, []);

  const loadDemoGoals = useCallback(() => setGoals(demoGoals), []);
  const resetGoals = useCallback(() => setGoals([]), []);

  const value = useMemo(
    () => ({
      goals,
      isLoadingGoals,
      saveGoal,
      addGoalActivity,
      deleteGoal,
      loadDemoGoals,
      resetGoals,
    }),
    [
      goals,
      isLoadingGoals,
      saveGoal,
      addGoalActivity,
      deleteGoal,
      loadDemoGoals,
      resetGoals,
    ]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}
