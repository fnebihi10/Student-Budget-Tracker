import { assertEditable, assertRevision } from '../domain/editConflict';
import { moneyMap, periodPlans, object } from '../services/decoders';
import type { BudgetState, Draft } from '../domain/models';
import type { Transaction, Bill } from '../domain/finance';
import type { PropsWithChildren } from 'react';
import { useConfirmedStore } from './useConfirmedStore';
import { validMoney, positiveMoney, parseMinor, recordBillPayment, clearBillPayment } from '../domain/finance';
import React, {
  createContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { totalCategoryBudget } from "../utils/calculations";
import { monthKey } from "../utils/dates";
import {
  billFromRow,
  fetchBudgetData,
  newId,
  persistBudgetChanges,
  persistBillPayment,
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

const positiveAmount = (value: unknown) => validMoney(value) ? positiveMoney(value) : 0;

const roundAmount = (value: number) => Math.round(value * 100) / 100;

const normalizeCategoryBudgets = (categoryBudgets: Record<string, number>, monthlyBudget: number) => {
  const entries = Object.entries(categoryBudgets).map(([category, value]) => [category, roundAmount(positiveAmount(value))] as [string, number]);
  const planned = entries.reduce((sum, [, value]) => sum + value, 0);
  const limit = positiveAmount(monthlyBudget);
  if (!planned || planned <= limit) return Object.fromEntries(entries);
  const scaled = entries.map(([category, value]) => [category, roundAmount((value / planned) * limit)] as [string, number]);
  const difference = roundAmount(limit - scaled.reduce((sum, [, value]) => sum + value, 0));
  if (scaled.length && difference) scaled[0][1] = roundAmount(scaled[0][1] + difference);
  return Object.fromEntries(scaled);
};


const dateThisMonth = (day: number) => {
  const date = new Date();
  date.setUTCDate(Math.min(day, new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate()));
  date.setUTCHours(12, 0, 0, 0);
  return date.toISOString();
};

const starterState: BudgetState = {
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
  periodBudgets: {},
  bills: [],
  subscription: {
    plan: "free",
    status: "inactive",
  },
};

const demoState: BudgetState = {
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

export const BudgetContext = createContext<ReturnType<typeof useBudgetValue> | undefined>(undefined);

function useBudgetValue() {
  const store = useConfirmedStore('budget', starterState, demoState,
    async (user) => {
      const cloud = await fetchBudgetData(user);
        const metadata = object(user.user_metadata || {});
        const cloudSettings = cloud.settings;
        const monthlyBudget =
          positiveAmount(cloudSettings?.monthly_budget) ||
          positiveAmount(metadata.monthly_budget) ||
          starterState.settings.monthlyBudget;
        return {
          ...starterState,
          onboardingComplete: true,
          sessionActive: true,
          profile: {
            revision: cloud.profile?.revision || 0,
            name: cloud.profile?.name || (typeof metadata.name === 'string' ? metadata.name : ''),
            email: user.email || "",
            school:
              cloud.profile?.school || (typeof metadata.school === 'string' ? metadata.school : ''),
          },
          settings: {
            revision: cloudSettings?.revision || 0,
            currency: cloudSettings?.currency || "EUR",
            monthlyBudget,
            notifications: cloudSettings?.notifications ?? true,
          },
          categoryBudgets: normalizeCategoryBudgets(
            {
              ...DEFAULT_CATEGORY_BUDGETS,
              ...moneyMap(cloudSettings?.category_budgets || {}),
            },
            monthlyBudget
          ),
          transactions: cloud.transactions.map(transactionFromRow),
          periodBudgets: periodPlans(cloudSettings?.period_budgets || {}),
          bills: cloud.bills.map(billFromRow),
          subscription: {
            plan: "free",
            status: "inactive",
          },
        };
    }, persistBudgetChanges);
  const data = store.data;
  const isLoading = store.status === 'loading' && !store.initialized;
  const storageError = store.error;
  const mutate = store.mutate;
  const retry = store.retry;
  const paymentIntents = useRef(new Map<string, { operationId: string; paidAt: string }>());
  const payBill = useCallback(async (id: string, period = monthKey(), recordTransaction = true) => {
    const key = `${id}/${period}/${recordTransaction}`;
    let intent = paymentIntents.current.get(key);
    if (!intent) {
      intent = { operationId: newId(), paidAt: new Date().toISOString() };
      paymentIntents.current.set(key, intent);
    }
    const request = { ...intent, billId: id, period, recordTransaction };
    const result = await mutate((current) => {
      const bill = assertEditable(current.bills, id);
      if (bill.paidMonth === period || bill.paymentHistory?.[period]) throw new Error('Already marked paid. Review transaction history before recording an expense.');
      const paid = recordBillPayment(bill, period, request.paidAt);
      const transaction: Transaction = { id: request.operationId, type: 'expense', amount: bill.amount, title: bill.title, category: bill.category, note: `Bill payment ${period}`, date: request.paidAt, recurring: false };
      return { ...current, bills: current.bills.map((item) => item.id === id ? paid : item),
        transactions: recordTransaction ? [transaction, ...current.transactions] : current.transactions };
    }, (before, after) => persistBillPayment(before, after, request));
    if (result) await retry();
    return result;
  }, [mutate, retry]);
  const update = useCallback((recipe: Partial<BudgetState> | ((current: BudgetState) => BudgetState)) => mutate((current) =>
    typeof recipe === 'function' ? recipe(current) : { ...current, ...recipe }
  ), [mutate]);

  const addTransaction = useCallback(
    (transaction: Omit<Transaction, "id">) => {
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
      return update((current) => ({ ...current, transactions: [item, ...current.transactions] }));
    },
    [update]
  );

  const deleteTransaction = useCallback((id: string, revision?: number) => update((current) => {
    assertEditable(current.transactions, id, revision);
    return { ...current, transactions: current.transactions.filter((item) => item.id !== id) };
  }), [update]);

  const updateTransaction = useCallback(
    (id: string, transaction: Omit<Transaction, "id">) => {
      const validType = transaction.type === "income" || transaction.type === "expense";
      const transactionDate = new Date(transaction.date || Date.now());
      const amount = positiveAmount(transaction.amount);
      if (
        !id ||
        !validType ||
        !transaction.title?.trim() ||
        !amount ||
        Number.isNaN(transactionDate.getTime())
      ) {
        return false;
      }
      return update((current) => {
        assertEditable(current.transactions, id, transaction.revision);
        return ({
        ...current,
        transactions: current.transactions.map((item) =>
          item.id === id
            ? {
                ...item,
                ...transaction,
                id,
                amount,
                title: transaction.title.trim(),
                note: transaction.note?.trim() || "",
                date: transactionDate.toISOString(),
              }
            : item
        ),
      });
      });
    },
    [update]
  );

  const setCategoryBudget = useCallback(
    (category: string, amount: unknown, period = monthKey(), revision?: number) =>
      update((current) => {
        assertRevision(current.settings, revision);
        const requested = parseMinor(amount) / 100;
        const plan = current.periodBudgets[period] || { monthlyBudget: current.settings.monthlyBudget, categoryBudgets: current.categoryBudgets };
        const plannedElsewhere =
          totalCategoryBudget(plan.categoryBudgets) -
          positiveAmount(plan.categoryBudgets[category]);
        const maximum = Math.max(0, positiveAmount(plan.monthlyBudget) - plannedElsewhere);
        if (requested > roundAmount(maximum)) throw new Error('Category limits exceed this month’s plan.');
        return {
          ...current,
          periodBudgets: {
            ...current.periodBudgets,
            [period]: { ...plan, categoryBudgets: { ...plan.categoryBudgets, [category]: requested } },
          },
        };
      }),
    [update]
  );

  const saveBill = useCallback(
    (bill: Omit<Draft<Bill>, "paidMonth"> & { paidMonth?: string | null }) => {
      const amount = positiveAmount(bill.amount);
      if (!bill.title?.trim() || !amount) return false;
      return update((current) => {
        const dueDay = Number(bill.dueDay);
        if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) throw new Error('Due day must be 1–31.');
        if (bill.id) {
          assertEditable(current.bills, bill.id, bill.revision);
          return { ...current, bills: current.bills.map((item) => item.id === bill.id ? { ...item, ...bill, amount, dueDay } : item) };
        }
        return ({
        ...current,
        bills: [
          {
            ...bill,
            id: newId(),
            amount,
            dueDay,
            paidMonth: null,
            paymentHistory: {},
          },
          ...current.bills,
        ],
        });
      });
    },
    [update]
  );

  const deleteBill = useCallback((id: string, revision?: number) => update((current) => {
    assertEditable(current.bills, id, revision);
    return { ...current, bills: current.bills.filter((bill) => bill.id !== id) };
  }), [update]);

  const toggleBill = useCallback(
    (id: string, period = monthKey()) =>
      update((current) => ({
        ...current,
        bills: current.bills.map((bill) =>
          bill.id === id
            ? {
                ...bill,
              ...(bill.paidMonth === period || bill.paymentHistory?.[period]
                ? clearBillPayment(bill, period)
                : recordBillPayment(bill, period, new Date().toISOString())),
              }
            : bill
        ),
      })),
    [update]
  );

  const updateProfile = useCallback(
    (profile: Partial<BudgetState["profile"]>) =>
      update((current) => {
        assertRevision(current.profile, profile.revision);
        return ({
        ...current,
        profile: { ...current.profile, ...profile },
      }); }),
    [update]
  );

  const updateSettings = useCallback(
    (settings: Partial<BudgetState["settings"]>) =>
      update((current) => {
        assertRevision(current.settings, settings.revision);
        if (settings.currency && settings.currency !== current.settings.currency && (current.transactions.length || current.bills.length)) {
          throw new Error('Currency is locked while financial records exist.');
        }
        const nextSettings = { ...current.settings, ...settings };
        if (Object.prototype.hasOwnProperty.call(settings, "monthlyBudget")) {
          nextSettings.monthlyBudget =
            positiveAmount(settings.monthlyBudget) || current.settings.monthlyBudget;
        }
        return {
          ...current,
          settings: nextSettings,
          ...(settings.monthlyBudget ? { periodBudgets: { ...current.periodBudgets, [monthKey()]: {
            monthlyBudget: nextSettings.monthlyBudget,
            categoryBudgets: normalizeCategoryBudgets(current.periodBudgets[monthKey()]?.categoryBudgets || current.categoryBudgets, nextSettings.monthlyBudget),
          } } } : {}),
          categoryBudgets: normalizeCategoryBudgets(
            current.categoryBudgets,
            nextSettings.monthlyBudget
          ),
        };
      }),
    [update]
  );

  const completeOnboarding = useCallback(
    (profile: Partial<BudgetState["profile"]>) =>
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

  const resetData = useCallback(() => update(() => starterState), [update]);
  const currentPlan = data.periodBudgets[monthKey()];

  const value = useMemo(
    () => ({
      ...data,
      categoryBudgets: currentPlan?.categoryBudgets || data.categoryBudgets,
      settings: currentPlan ? { ...data.settings, monthlyBudget: currentPlan.monthlyBudget } : data.settings,
      defaultCategoryBudgets: data.categoryBudgets,
      syncStatus: store.status,
      retrySync: store.retry,
      isLoading,
      storageError,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setCategoryBudget,
      saveBill,
      deleteBill,
      toggleBill,
      payBill,
      updateProfile,
      updateSettings,
      completeOnboarding,
      signIn,
      logout,
      resetData,
    }),
    [
      store.status, store.retry,
      data,
      currentPlan,
      isLoading,
      storageError,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setCategoryBudget,
      saveBill,
      deleteBill,
      toggleBill,
      payBill,
      updateProfile,
      updateSettings,
      completeOnboarding,
      signIn,
      logout,
      resetData,
    ]
  );

  return value;
}

export function BudgetProvider({ children }: PropsWithChildren) {
  const value = useBudgetValue();
  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};
