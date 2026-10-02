import { useConfirmedStore } from './useConfirmedStore';
import React, {
  createContext,
  useCallback,
  useMemo,
} from "react";
import {
  fetchRows,
  newId,
  splitFromRow,
  splitToRow,
  persistCollection,
} from "../services/cloudData";


const futureDate = (days) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(12, 0, 0, 0);
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
  const store = useConfirmedStore('splits', [], demoSplits,
    async (user) => (await fetchRows('splits', user.id)).map(splitFromRow),
    (userId, before, after) => persistCollection('splits', userId, before, after, splitToRow));
  const splits = store.data;
  const isLoadingSplits = store.status === 'loading' && !store.initialized;
  const splitsStorageError = store.error;
  const setSplits = store.mutate;

  const saveSplit = useCallback((split) => {
    const amount = Number(split.amount);
    if (
      !split.title?.trim() ||
      !split.person?.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return false;
    }
    return setSplits((current) => {
      if (split.id) {
        return current.map((item) =>
          item.id === split.id ? { ...item, ...split } : item
        );
      }
      return [
        {
          ...split,
          amount,
          id: newId(),
          status: "open",
          createdAt: new Date().toISOString(),
        },
        ...current,
      ];
    });
  }, [setSplits]);

  const settleSplit = useCallback((id) => {
    return setSplits((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "open" ? "settled" : "open",
              settledAt:
                item.status === "open" ? new Date().toISOString() : null,
            }
          : item
      )
    );
  }, [setSplits]);

  const deleteSplit = useCallback((id) =>
    setSplits((current) => current.filter((item) => item.id !== id)), [setSplits]);

  const resetSplits = useCallback(() => setSplits(() => []), [setSplits]);

  const value = useMemo(
    () => ({
      syncStatus: store.status,
      retrySync: store.retry,
      splits,
      isLoadingSplits,
      splitsStorageError,
      saveSplit,
      settleSplit,
      deleteSplit,
      resetSplits,
    }),
    [
      store.status, store.retry,
      splits,
      isLoadingSplits,
      splitsStorageError,
      saveSplit,
      settleSplit,
      deleteSplit,
      resetSplits,
    ]
  );

  return (
    <SplitsContext.Provider value={value}>{children}</SplitsContext.Provider>
  );
}
