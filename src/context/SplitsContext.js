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
  newId,
  splitFromRow,
  splitToRow,
  upsertRows,
} from "../services/cloudData";

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
  const { user } = React.useContext(AuthContext);
  const [splits, setSplits] = useState([]);
  const [isLoadingSplits, setIsLoadingSplits] = useState(true);
  const [splitsStorageError, setSplitsStorageError] = useState("");
  const [splitsCloudReady, setSplitsCloudReady] = useState(false);
  const cloudUserRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!Array.isArray(parsed)) throw new Error("Invalid shared expenses data");
          setSplits(parsed);
        }
      })
      .catch(() => setSplitsStorageError("Shared expenses could not be loaded."))
      .finally(() => setIsLoadingSplits(false));
  }, []);

  useEffect(() => {
    if (isLoadingSplits) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(splits)).catch(() =>
      setSplitsStorageError("Shared expenses could not be saved.")
    );
  }, [splits, isLoadingSplits]);

  useEffect(() => {
    if (!user) {
      if (cloudUserRef.current) setSplits([]);
      cloudUserRef.current = null;
      setSplitsCloudReady(false);
      return;
    }
    if (isLoadingSplits || cloudUserRef.current === user.id) return;
    cloudUserRef.current = user.id;
    setIsLoadingSplits(true);
    fetchRows("splits", user.id, "created_at")
      .then((rows) => {
        setSplits(rows.map(splitFromRow));
        setSplitsCloudReady(true);
      })
      .catch(() => {
        setSplitsCloudReady(false);
        setSplitsStorageError("Shared expenses could not be loaded from the cloud.");
      })
      .finally(() => setIsLoadingSplits(false));
  }, [user, isLoadingSplits]);

  useEffect(() => {
    if (!user || !splitsCloudReady || isLoadingSplits) return;
    const timer = setTimeout(() => {
      upsertRows("splits", user.id, splits.map(splitToRow)).catch(() =>
        setSplitsStorageError("Shared expenses could not be synced.")
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [user, splits, splitsCloudReady, isLoadingSplits]);

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
    setSplits((current) => {
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
    return true;
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
    if (user) {
      deleteRow("splits", user.id, id).catch(() =>
        setSplitsStorageError("The shared expense could not be deleted from the cloud.")
      );
    }
  }, [user]);

  const loadDemoSplits = useCallback(() => setSplits(demoSplits), []);
  const resetSplits = useCallback(() => setSplits([]), []);

  const value = useMemo(
    () => ({
      splits,
      isLoadingSplits,
      splitsStorageError,
      saveSplit,
      settleSplit,
      deleteSplit,
      loadDemoSplits,
      resetSplits,
    }),
    [
      splits,
      isLoadingSplits,
      splitsStorageError,
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
