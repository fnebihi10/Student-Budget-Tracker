import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@pocketwise/v1";

const dateThisMonth = (day) => {
  const date = new Date();
  date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()));
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
};

const starterState = {
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
    food: 220,
    housing: 420,
    transport: 80,
    study: 70,
    social: 90,
    health: 50,
    shopping: 80,
    other: 40,
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
    { id: "bill-1", title: "Student residence", amount: 420, category: "housing", dueDay: 4, paid: true },
    { id: "bill-2", title: "Phone plan", amount: 18, category: "other", dueDay: 21, paid: false },
    { id: "bill-3", title: "Music student", amount: 5.99, category: "social", dueDay: 26, paid: false },
  ],
};

export const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const [data, setData] = useState(starterState);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          setData({
            ...starterState,
            ...parsed,
            profile: { ...starterState.profile, ...parsed.profile },
            settings: { ...starterState.settings, ...parsed.settings },
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

  const update = useCallback((recipe) => {
    setData((current) =>
      typeof recipe === "function" ? recipe(current) : { ...current, ...recipe }
    );
  }, []);

  const addTransaction = useCallback(
    (transaction) => {
      const item = {
        ...transaction,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        amount: Number(transaction.amount),
        date: transaction.date || new Date().toISOString(),
      };
      update((current) => ({
        ...current,
        transactions: [item, ...current.transactions],
      }));
      return item;
    },
    [update]
  );

  const deleteTransaction = useCallback(
    (id) =>
      update((current) => ({
        ...current,
        transactions: current.transactions.filter((item) => item.id !== id),
      })),
    [update]
  );

  const setCategoryBudget = useCallback(
    (category, amount) =>
      update((current) => ({
        ...current,
        categoryBudgets: {
          ...current.categoryBudgets,
          [category]: Math.max(0, Number(amount) || 0),
        },
      })),
    [update]
  );

  const saveBill = useCallback(
    (bill) =>
      update((current) => ({
        ...current,
        bills: [
          { ...bill, id: `${Date.now()}-bill`, amount: Number(bill.amount), paid: false },
          ...current.bills,
        ],
      })),
    [update]
  );

  const toggleBill = useCallback(
    (id) =>
      update((current) => ({
        ...current,
        bills: current.bills.map((bill) =>
          bill.id === id ? { ...bill, paid: !bill.paid } : bill
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
      update((current) => ({
        ...current,
        settings: { ...current.settings, ...settings },
      })),
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

  const loadDemo = useCallback(() => setData(demoState), []);
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
