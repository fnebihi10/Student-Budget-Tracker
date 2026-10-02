import { useConfirmedStore } from './useConfirmedStore';
import React, {
  createContext,
  useCallback,
  useMemo,
} from "react";
import {
  fetchRows,
  newId,
  subscriptionFromRow,
  subscriptionToRow,
  persistCollection,
} from "../services/cloudData";


const demoSubscriptions = [
  {
    id: "demo-sub-spotify",
    serviceId: "spotify",
    name: "Spotify Student",
    amount: 5.99,
    frequency: "monthly",
    nextBillingDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    category: "entertainment",
    reminderDays: 3,
    notes: "Student plan",
    freeTrial: false,
    icon: "musical-notes",
    color: "#32B86B",
    status: "active",
  },
  {
    id: "demo-sub-netflix",
    serviceId: "netflix",
    name: "Netflix",
    amount: 13.99,
    frequency: "monthly",
    nextBillingDate: new Date(Date.now() + 12 * 86400000).toISOString(),
    category: "entertainment",
    reminderDays: 3,
    notes: "",
    freeTrial: false,
    icon: "play",
    color: "#E84B4B",
    status: "active",
  },
  {
    id: "demo-sub-icloud",
    serviceId: "icloud",
    name: "iCloud+",
    amount: 0.99,
    frequency: "monthly",
    nextBillingDate: new Date(Date.now() + 19 * 86400000).toISOString(),
    category: "cloud",
    reminderDays: 1,
    notes: "Storage plan",
    freeTrial: false,
    icon: "cloud",
    color: "#5C9CF2",
    status: "active",
  },
];

export const SubscriptionsContext = createContext(null);

export function SubscriptionsProvider({ children }) {
  const store = useConfirmedStore('subscriptions', [], demoSubscriptions,
    async (user) => (await fetchRows('subscriptions', user.id)).map(subscriptionFromRow),
    (userId, before, after) => persistCollection('subscriptions', userId, before, after, subscriptionToRow));
  const subscriptions = store.data;
  const isLoadingSubscriptions = store.status === 'loading' && !store.initialized;
  const subscriptionsStorageError = store.error;
  const setSubscriptions = store.mutate;

  const saveSubscription = useCallback((subscription) => {
    const amount = Number(subscription.amount);
    if (
      !subscription.name?.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return false;
    }
    return setSubscriptions((current) => {
      if (subscription.id) {
        return current.map((item) =>
          item.id === subscription.id ? { ...item, ...subscription } : item
        );
      }
      return [
        {
          ...subscription,
          amount,
          id: newId(),
          createdAt: new Date().toISOString(),
          status: "active",
        },
        ...current,
      ];
    });
  }, [setSubscriptions]);

  const toggleSubscription = useCallback((id) => {
    return setSubscriptions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "active" ? "paused" : "active",
            }
          : item
      )
    );
  }, [setSubscriptions]);

  const deleteSubscription = useCallback((id) =>
    setSubscriptions((current) => current.filter((item) => item.id !== id)), [setSubscriptions]);


  const resetSubscriptions = useCallback(() => setSubscriptions(() => []), [setSubscriptions]);

  const value = useMemo(
    () => ({
      syncStatus: store.status,
      retrySync: store.retry,
      subscriptions,
      isLoadingSubscriptions,
      subscriptionsStorageError,
      saveSubscription,
      toggleSubscription,
      deleteSubscription,
      resetSubscriptions,
    }),
    [
      store.status, store.retry,
      subscriptions,
      isLoadingSubscriptions,
      subscriptionsStorageError,
      saveSubscription,
      toggleSubscription,
      deleteSubscription,
      resetSubscriptions,
    ]
  );

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
}
