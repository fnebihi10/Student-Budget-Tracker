import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "@pocketwise/personal-subscriptions/v1";

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
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setSubscriptions(JSON.parse(stored));
      })
      .catch(() => {})
      .finally(() => setIsLoadingSubscriptions(false));
  }, []);

  useEffect(() => {
    if (isLoadingSubscriptions) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions)).catch(
      () => {}
    );
  }, [subscriptions, isLoadingSubscriptions]);

  const saveSubscription = useCallback((subscription) => {
    setSubscriptions((current) => {
      if (subscription.id) {
        return current.map((item) =>
          item.id === subscription.id ? { ...item, ...subscription } : item
        );
      }
      return [
        {
          ...subscription,
          id: `${Date.now()}-subscription`,
          createdAt: new Date().toISOString(),
          status: "active",
        },
        ...current,
      ];
    });
  }, []);

  const toggleSubscription = useCallback((id) => {
    setSubscriptions((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === "active" ? "paused" : "active",
            }
          : item
      )
    );
  }, []);

  const deleteSubscription = useCallback((id) => {
    setSubscriptions((current) => current.filter((item) => item.id !== id));
  }, []);

  const loadDemoSubscriptions = useCallback(
    () => setSubscriptions(demoSubscriptions),
    []
  );

  const resetSubscriptions = useCallback(() => setSubscriptions([]), []);

  const value = useMemo(
    () => ({
      subscriptions,
      isLoadingSubscriptions,
      saveSubscription,
      toggleSubscription,
      deleteSubscription,
      loadDemoSubscriptions,
      resetSubscriptions,
    }),
    [
      subscriptions,
      isLoadingSubscriptions,
      saveSubscription,
      toggleSubscription,
      deleteSubscription,
      loadDemoSubscriptions,
      resetSubscriptions,
    ]
  );

  return (
    <SubscriptionsContext.Provider value={value}>
      {children}
    </SubscriptionsContext.Provider>
  );
}
