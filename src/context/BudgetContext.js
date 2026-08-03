import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { totalCategoryBudget } from "../utils/calculations";
import { monthKey } from "../utils/dates";
import { AuthContext } from "./AuthContext";
import {
  billFromRow,
  deleteRow,
  fetchBudgetData,
  newId,
  syncBudgetData,
  transactionFromRow,
} from "../services/cloudData";

const DEFAULT_CATEGORY_BUDGETS = {
  food: 190,
  housing: 390,
  transport: 70,
  study: 60,
  social: 65,
  health: 45,
  shopping: 50,
  other: 30,
};

const positiveAmount = (value) => {
  const amount = Number(String(value).replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const roundAmount = (value) => Math.round(value * 100) / 100;

const normalizeCategoryBudgets = (categoryBudgets, monthlyBudget) => {
  const entries = Object.entries(categoryBudgets).map(([category, value]) => [category, roundAmount(positiveAmount(value))]);
  const planned = entries.reduce((sum, [, value]) => sum + value, 0);
  const limit = positiveAmount(monthlyBudget);
  if (!planned || planned <= limit) return Object.fromEntries(entries);
  const scaled = entries.map(([category, value]) => [category, roundAmount((value / planned) * limit)]);
  const difference = roundAmount(limit - scaled.reduce((sum, [, value]) => sum + value, 0));
  if (scaled.length && difference) scaled[0][1] = roundAmount(scaled[0][1] + difference);
  return Object.fromEntries(scaled);
};

const normalizeBills = (bills = []) =>
  Array.isArray(bills)
    ? bills.map((bill) => {
        const { paid, ...currentBill } = bill;
        return {
          ...currentBill,
          amount: positiveAmount(bill.amount),
          dueDay: Math.min(31, Math.max(1, Math.round(Number(bill.dueDay) || 1))),
          paidMonth: bill.paidMonth || (paid ? monthKey() : null),
        };
      })
    : [];

const STORAGE_KEY = "@pocketwise/v1";

const dateThisMonth = (day) => {
  const date = new Date();
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
};

const starterState = {
  demoMode: false,
  sessionActive: true,
  onboardingComplete: false,
  profile: {
    name: "",
    email: "",
    school: "",
  },
  settings: {
    currency: "EUR",
    monthlyBudget: 900,
    notifications: true,
  },
  categoryBudgets: {
    ...DEFAULT_CATEGORY_BUDGETS,
  },
  transactions: [],
  bills: [],
  subscription: {
    plan: "free",
    status: "inactive",
  },
};

const demoState = {
  ...starterState,
  onboardingComplete: true,
  demoMode: true,
  profile: {
    name: "Alex",
    email: "alex@student.example",
    school: "City University",
  },
  transactions: [
    { id: "demo-1", type: "income", amount: 780, category: "salary", title: "Campus job", date: dateThisMonth(2), recurring: true },
    { id: "demo-2", type: "income", amount: 350, category: "scholarship", title: "Study grant", date: dateThisMonth(3), recurring: true },
    { id: "demo-3", type: "expense", amount: 420, category: "housing", title: "Student residence", date: dateThisMonth(4), recurring: true },
    { id: "demo-4", type: "expense", amount: 38.4, category: "food", title: "Weekly groceries", date: dateThisMonth(8), recurring: false },
    { id: "demo-5", type: "expense", amount: 14.5, category: "transport", title: "Metro pass", date: dateThisMonth(10), recurring: false },
    { id: "demo-6", type: "expense", amount: 22, category: "study", title: "Course reader", date: dateThisMonth(12), recurring: false },
    { id: "demo-7", type: "expense", amount: 18.2, category: "social", title: "Coffee with Maya", date: dateThisMonth(15), recurring: false },
    { id: "demo-8", type: "expense", amount: 27.9, category: "food", title: "Lunches", date: dateThisMonth(18), recurring: false },
  ],
  bills: [
    { id: "bill-1", title: "Student residence", amount: 420, category: "housing", dueDay: 4, paidMonth: monthKey() },
    { id: "bill-2", title: "Phone plan", amount: 18, category: "other", dueDay: 21, paidMonth: null },
    { id: "bill-3", title: "Music student", amount: 5.99, category: "social", dueDay: 26, paidMonth: null },
  ],
};

export const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const {
    user,
    isAuthLoading,
    pendingOnboarding,
    clearPendingOnboarding,
  } = useContext(AuthContext);
  const [data, setData] = useState(starterState);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const cloudUserRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          const settings = { ...starterState.settings, ...(parsed.settings || {}) };
          const monthlyBudget = positiveAmount(settings.monthlyBudget) || starterState.settings.monthlyBudget;
          setData({
            ...starterState,
            ...parsed,
            profile: { ...starterState.profile, ...parsed.profile },
            settings: { ...settings, monthlyBudget },
            categoryBudgets: normalizeCategoryBudgets(
              { ...DEFAULT_CATEGORY_BUDGETS, ...(parsed.categoryBudgets || {}) },
              monthlyBudget
            ),
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            bills: normalizeBills(parsed.bills),
            subscription: { ...starterState.subscription, ...parsed.subscription },
          });
        }
      })
      .catch(() => setStorageError("Your saved data could not be loaded."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() =>
      setStorageError("Changes could not be saved on this device.")
    );
  }, [data, isLoading]);

  useEffect(() => {
    if (!user) {
      if (cloudUserRef.current) setData(starterState);
      cloudUserRef.current = null;
      setCloudReady(false);
      return;
    }
    if (isAuthLoading) return;
    if (isLoading || cloudUserRef.current === user.id) return;
    cloudUserRef.current = user.id;
    setIsLoading(true);
    fetchBudgetData(user)
      .then((cloud) => {
        const metadata = user.user_metadata || {};
        const pending =
          pendingOnboarding?.email === user.email?.toLowerCase()
            ? pendingOnboarding
            : null;
        const cloudSettings = cloud.settings || {};
        const monthlyBudget =
          positiveAmount(pending?.monthlyBudget) ||
          positiveAmount(cloudSettings.monthly_budget) ||
          positiveAmount(metadata.monthly_budget) ||
          starterState.settings.monthlyBudget;
        setData({
          ...starterState,
          onboardingComplete: true,
          sessionActive: true,
          profile: {
            name: pending?.name || cloud.profile?.name || metadata.name || "",
            email: user.email || "",
            school:
              pending?.school || cloud.profile?.school || metadata.school || "",
          },
          settings: {
            currency: cloudSettings.currency || "EUR",
            monthlyBudget,
            notifications: cloudSettings.notifications ?? true,
          },
          categoryBudgets: normalizeCategoryBudgets(
            {
              ...DEFAULT_CATEGORY_BUDGETS,
              ...(cloudSettings.category_budgets || {}),
            },
            monthlyBudget
          ),
          transactions: cloud.transactions.map(transactionFromRow),
          bills: cloud.bills.map(billFromRow),
          subscription: {
            plan: cloudSettings.subscription_plan || "free",
            status: cloudSettings.subscription_status || "inactive",
          },
        });
        setCloudReady(true);
        if (pending) clearPendingOnboarding();
      })
      .catch(() => {
        setCloudReady(false);
        setStorageError("Your cloud budget could not be loaded.");
      })
      .finally(() => setIsLoading(false));
  }, [
    user,
    isAuthLoading,
    pendingOnboarding,
    clearPendingOnboarding,
    isLoading,
  ]);

  useEffect(() => {
    if (!user || !cloudReady || isLoading) return;
    const timer = setTimeout(() => {
      syncBudgetData(user.id, data).catch(() =>
        setStorageError("Your latest changes could not be synced.")
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [user, data, cloudReady, isLoading]);

  const update = useCallback((recipe) => {
    setData((current) =>
      typeof recipe === "function" ? recipe(current) : { ...current, ...recipe }
    );
  }, []);

  const addTransaction = useCallback(
    (transaction) => {
      const validType = transaction.type === "income" || transaction.type === "expense";
      const transactionDate = new Date(transaction.date || Date.now());
      if (
        !validType ||
        !transaction.title?.trim() ||
        Number.isNaN(transactionDate.getTime())
      ) {
        return null;
      }
      const item = {
        ...transaction,
        id: newId(),
        amount: positiveAmount(transaction.amount),
        date: transactionDate.toISOString(),
      };
      if (!item.amount) return null;
      update((current) => ({ ...current, transactions: [item, ...current.transactions] }));
      return item;
    },
    [update]
  );

  const deleteTransaction = useCallback(
    (id) => {
      update((current) => ({
        ...current,
        transactions: current.transactions.filter((item) => item.id !== id),
      }));
      if (user) {
        deleteRow("transactions", user.id, id).catch(() =>
          setStorageError("The transaction could not be deleted from the cloud.")
        );
      }
    },
    [update, user]
  );

  const setCategoryBudget = useCallback(
    (category, amount) =>
      update((current) => {
        const requested = roundAmount(positiveAmount(amount));
        const plannedElsewhere =
          totalCategoryBudget(current.categoryBudgets) -
          positiveAmount(current.categoryBudgets[category]);
        const maximum = Math.max(0, positiveAmount(current.settings.monthlyBudget) - plannedElsewhere);
        return {
          ...current,
          categoryBudgets: {
            ...current.categoryBudgets,
            [category]: Math.min(requested, roundAmount(maximum)),
          },
        };
      }),
    [update]
  );

  const saveBill = useCallback(
    (bill) => {
      const amount = positiveAmount(bill.amount);
      if (!bill.title?.trim() || !amount) return false;
      update((current) => ({
        ...current,
        bills: [
          {
            ...bill,
            id: newId(),
            amount,
            dueDay: Math.min(31, Math.max(1, Math.round(Number(bill.dueDay) || 1))),
            paidMonth: null,
          },
          ...current.bills,
        ],
      }));
      return true;
    },
    [update]
  );

  const toggleBill = useCallback(
    (id) =>
      update((current) => ({
        ...current,
        bills: current.bills.map((bill) =>
          bill.id === id
            ? {
                ...bill,
                paidMonth: bill.paidMonth === monthKey() ? null : monthKey(),
              }
            : bill
        ),
      })),
    [update]
  );

  const updateProfile = useCallback(
    (profile) =>
      update((current) => ({
        ...current,
        profile: { ...current.profile, ...profile },
      })),
    [update]
  );

  const updateSettings = useCallback(
    (settings) =>
      update((current) => {
        const nextSettings = { ...current.settings, ...settings };
        if (Object.prototype.hasOwnProperty.call(settings, "monthlyBudget")) {
          nextSettings.monthlyBudget =
            positiveAmount(settings.monthlyBudget) || current.settings.monthlyBudget;
        }
        return {
          ...current,
          settings: nextSettings,
          categoryBudgets: normalizeCategoryBudgets(
            current.categoryBudgets,
            nextSettings.monthlyBudget
          ),
        };
      }),
    [update]
  );

  const completeOnboarding = useCallback(
    (profile) =>
      update((current) => ({
        ...current,
        sessionActive: true,
        onboardingComplete: true,
        profile: { ...current.profile, ...profile },
      })),
    [update]
  );

  const signIn = useCallback(
    () => update((current) => ({ ...current, sessionActive: true })),
    [update]
  );

  const logout = useCallback(
    () => update((current) => ({ ...current, sessionActive: false })),
    [update]
  );

  const loadDemo = useCallback(
    () => setData({ ...demoState, bills: normalizeBills(demoState.bills) }),
    []
  );
  const resetData = useCallback(() => setData(starterState), []);

  const value = useMemo(
    () => ({
      ...data,
      isLoading,
      storageError,
      addTransaction,
      deleteTransaction,
      setCategoryBudget,
      saveBill,
      toggleBill,
      updateProfile,
      updateSettings,
      completeOnboarding,
      signIn,
      logout,
      loadDemo,
      resetData,
    }),
    [
      data,
      isLoading,
      storageError,
      addTransaction,
      deleteTransaction,
      setCategoryBudget,
      saveBill,
      toggleBill,
      updateProfile,
      updateSettings,
      completeOnboarding,
      signIn,
      logout,
      loadDemo,
      resetData,
    ]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};
