import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@pocketwise/shared-expenses/v1";

const futureDate = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
};

const demoSplits = [
  {
    id: "demo-split-1",
    title: "Apartment groceries",
    person: "Maya",
    amount: 24.5,
    direction: "owed_to_me",
    category: "groceries",
    dueDate: futureDate(4),
    note: "Weekend grocery run",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-split-2",
    title: "Train tickets",
    person: "Noah",
    amount: 18,
    direction: "i_owe",
    category: "trip",
    dueDate: futureDate(8),
    note: "Return ticket",
    status: "open",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-split-3",
    title: "Electricity share",
    person: "Roommates",
    amount: 31.2,
    direction: "i_owe",
    category: "utilities",
    dueDate: futureDate(-10),
    note: "Last month",
    status: "settled",
    settledAt: futureDate(-7),
    createdAt: futureDate(-18),
  },
];

export const SplitsContext = createContext(null);

export function SplitsProvider({ children }) {
  const [splits, setSplits] = useState([]);
  const [isLoadingSplits, setIsLoadingSplits] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setSplits(JSON.parse(stored));
      })
      .catch(() => {})
      .finally(() => setIsLoadingSplits(false));
  }, []);

  useEffect(() => {
    if (isLoadingSplits) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(splits)).catch(() => {});
  }, [splits, isLoadingSplits]);

  const saveSplit = useCallback((split) => {
    setSplits((current) => {
      if (split.id) {
        return current.map((item) =>
          item.id === split.id ? { ...item, ...split } : item
        );
      }
      return [
        {
          ...split,
          id: `${Date.now()}-split`,
          status: "open",
          createdAt: new Date().toISOString(),
        },
        ...current,
      ];
    });
  }, []);

  const settleSplit = useCallback((id) => {
    setSplits((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "open" ? "settled" : "open",
              settledAt:
                item.status === "open" ? new Date().toISOString() : undefined,
            }
          : item
      )
    );
  }, []);

  const deleteSplit = useCallback((id) => {
    setSplits((current) => current.filter((item) => item.id !== id));
  }, []);

  const loadDemoSplits = useCallback(() => setSplits(demoSplits), []);
  const resetSplits = useCallback(() => setSplits([]), []);

  const value = useMemo(
    () => ({
      splits,
      isLoadingSplits,
      saveSplit,
      settleSplit,
      deleteSplit,
      loadDemoSplits,
      resetSplits,
    }),
    [
      splits,
      isLoadingSplits,
      saveSplit,
      settleSplit,
      deleteSplit,
      loadDemoSplits,
      resetSplits,
    ]
  );

  return (
    <SplitsContext.Provider value={value}>{children}</SplitsContext.Provider>
  );
}
