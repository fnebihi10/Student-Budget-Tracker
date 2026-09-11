import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext } from "./AuthContext";
import {
  deleteRow,
  fetchRows,
  goalFromRow,
  goalToRow,
  newId,
  upsertRows,
} from "../services/cloudData";

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
  const { user } = React.useContext(AuthContext);
  const [goals, setGoals] = useState([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [goalsStorageError, setGoalsStorageError] = useState("");
  const [goalsCloudReady, setGoalsCloudReady] = useState(false);
  const cloudUserRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!Array.isArray(parsed)) throw new Error("Invalid goals data");
          setGoals(parsed);
        }
      })
      .catch(() => setGoalsStorageError("Savings goals could not be loaded."))
      .finally(() => setIsLoadingGoals(false));
  }, []);

  useEffect(() => {
    if (isLoadingGoals) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals)).catch(() =>
      setGoalsStorageError("Savings goals could not be saved.")
    );
  }, [goals, isLoadingGoals]);

  useEffect(() => {
    if (!user) {
      const shouldClear = Boolean(cloudUserRef.current);
      cloudUserRef.current = null;
      if (shouldClear) {
        queueMicrotask(() => {
          setGoals([]);
          setGoalsCloudReady(false);
        });
      }
      return;
    }
    if (isLoadingGoals || cloudUserRef.current === user.id) return;
    cloudUserRef.current = user.id;
    setIsLoadingGoals(true);
    fetchRows("goals", user.id, "created_at")
      .then((rows) => {
        setGoals(rows.map(goalFromRow));
        setGoalsCloudReady(true);
      })
      .catch(() => {
        setGoalsCloudReady(false);
        setGoalsStorageError("Savings goals could not be loaded from the cloud.");
      })
      .finally(() => setIsLoadingGoals(false));
  }, [user, isLoadingGoals]);

  useEffect(() => {
    if (
      !user ||
      cloudUserRef.current !== user.id ||
      !goalsCloudReady ||
      isLoadingGoals
    ) return;
    const timer = setTimeout(() => {
      upsertRows("goals", user.id, goals.map(goalToRow)).catch(() =>
        setGoalsStorageError("Savings goals could not be synced.")
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [user, goals, goalsCloudReady, isLoadingGoals]);

  const saveGoal = useCallback((goal) => {
    const target = Number(goal.target);
    const saved = Number(goal.saved) || 0;
    if (!goal.name?.trim() || !Number.isFinite(target) || target <= 0) return false;
    setGoals((current) => {
      if (goal.id) {
        return current.map((item) =>
          item.id === goal.id ? { ...item, ...goal } : item
        );
      }
      return [
        {
          ...goal,
          id: newId(),
          target,
          saved: Math.max(0, saved),
          createdAt: new Date().toISOString(),
          activity: [],
        },
        ...current,
      ];
    });
    return true;
  }, []);

  const addGoalActivity = useCallback((id, amount, note = "") => {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric === 0) return false;
    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== id) return goal;
        const nextSaved = Math.max(0, (Number(goal.saved) || 0) + numeric);
        return {
          ...goal,
          saved: nextSaved,
          activity: [
            {
              id: newId(),
              amount: numeric,
              note: note.trim(),
              date: new Date().toISOString(),
            },
            ...(goal.activity || []),
          ],
        };
      })
    );
    return true;
  }, []);

  const deleteGoal = useCallback((id) => {
    setGoals((current) => current.filter((goal) => goal.id !== id));
    if (user) {
      deleteRow("goals", user.id, id).catch(() =>
        setGoalsStorageError("The goal could not be deleted from the cloud.")
      );
    }
  }, [user]);

  const loadDemoGoals = useCallback(() => setGoals(demoGoals), []);
  const resetGoals = useCallback(() => setGoals([]), []);

  const value = useMemo(
    () => ({
      goals,
      isLoadingGoals,
      goalsStorageError,
      saveGoal,
      addGoalActivity,
      deleteGoal,
      loadDemoGoals,
      resetGoals,
    }),
    [
      goals,
      isLoadingGoals,
      goalsStorageError,
      saveGoal,
      addGoalActivity,
      deleteGoal,
      loadDemoGoals,
      resetGoals,
    ]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}
