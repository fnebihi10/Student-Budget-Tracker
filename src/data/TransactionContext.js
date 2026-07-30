import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TransactionContext = createContext();
const STORAGE_KEY = 'USER_TRANSACTIONS';
const SAVINGS_KEY = 'USER_SAVINGS';

/* DEFAULT TRANSACTIONS */
const DEFAULT_TRANSACTIONS = [
  {
    id: '1',
    title: 'City Scholarship',
    amount: 500,
    type: 'income',
    frequency: 'one-time',
    date: '2025-12-06',
  },
  {
    id: '2',
    title: 'Academic Scholarship',
    amount: 50,
    type: 'income',
    frequency: 'monthly',
    date: '2025-11-30',
  },
];

export function TransactionProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loaded, setLoaded] = useState(false);

  /* LOAD DATA */
  useEffect(() => {
    const loadData = async () => {
      const savedTransactions = await AsyncStorage.getItem(STORAGE_KEY);
      const savedSavings = await AsyncStorage.getItem(SAVINGS_KEY);

      if (savedTransactions) {
        const parsed = JSON.parse(savedTransactions);
        const fixed = parsed.map(t => ({
          ...t,
          frequency: t.frequency || 'one-time',
          date: t.date || new Date().toISOString().split('T')[0],
        }));
        setTransactions(fixed);
      } else {
        setTransactions(DEFAULT_TRANSACTIONS);
      }

      if (savedSavings) {
        setSavingsGoals(JSON.parse(savedSavings));
      } else {
        setSavingsGoals([]);
      }
      setLoaded(true);
    };
    loadData();
  }, []);

  /* SAVE DATA */
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    AsyncStorage.setItem(SAVINGS_KEY, JSON.stringify(savingsGoals));
  }, [transactions, savingsGoals, loaded]);

  /* TRANSACTIONS */
  const addTransaction = (transaction) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      date: transaction.date || new Date().toISOString().split('T')[0],
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  };

  // --- NEW FUNCTION: UPDATE TRANSACTION ---
  const updateTransaction = (id, updatedData) => {
    setTransactions(prev => 
      prev.map(t => (t.id === id ? { ...t, ...updatedData } : t))
    );
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBalance = totalIncome - totalExpenses;

  /* SAVINGS */
  const addSavingsGoal = (goal) => {
    setSavingsGoals(prev => [
      { id: Date.now().toString(), currentAmount: 0, ...goal },
      ...prev,
    ]);
  };

  const depositToGoal = (goalId, amount) => {
    setSavingsGoals(prev =>
      prev.map(goal =>
        goal.id === goalId
          ? { ...goal, currentAmount: goal.currentAmount + amount }
          : goal
      )
    );
  };

  /* UTILS */
  const formatCurrency = (value) => `€${value.toFixed(2)}`;

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction, // <--- EXPORTED HERE
        deleteTransaction,
        totalIncome,
        totalExpenses,
        totalBalance,
        savingsGoals,
        addSavingsGoal,
        depositToGoal,
        formatCurrency,
        loaded,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export const useTransactions = () => useContext(TransactionContext);





