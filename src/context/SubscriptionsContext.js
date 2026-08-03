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
  subscriptionFromRow,
  subscriptionToRow,
  upsertRows,
} from "../services/cloudData";

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
  const { user } = React.useContext(AuthContext);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [subscriptionsStorageError, setSubscriptionsStorageError] = useState("");
  const [subscriptionsCloudReady, setSubscriptionsCloudReady] = useState(false);
  const cloudUserRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed = JSON.parse(stored);
          if (!Array.isArray(parsed)) throw new Error("Invalid subscriptions data");
          setSubscriptions(parsed);
        }
      })
      .catch(() =>
        setSubscriptionsStorageError("Subscriptions could not be loaded.")
      )
      .finally(() => setIsLoadingSubscriptions(false));
  }, []);

  useEffect(() => {
    if (isLoadingSubscriptions) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions)).catch(
      () => setSubscriptionsStorageError("Subscriptions could not be saved.")
    );
  }, [subscriptions, isLoadingSubscriptions]);

  useEffect(() => {
    if (!user) {
      if (cloudUserRef.current) setSubscriptions([]);
      cloudUserRef.current = null;
      setSubscriptionsCloudReady(false);
      return;
    }
    if (isLoadingSubscriptions || cloudUserRef.current === user.id) return;
    cloudUserRef.current = user.id;
    setIsLoadingSubscriptions(true);
    fetchRows("subscriptions", user.id, "next_billing_date")
      .then((rows) => {
        setSubscriptions(rows.map(subscriptionFromRow));
        setSubscriptionsCloudReady(true);
      })
      .catch(() => {
        setSubscriptionsCloudReady(false);
        setSubscriptionsStorageError("Subscriptions could not be loaded from the cloud.");
      })
      .finally(() => setIsLoadingSubscriptions(false));
  }, [user, isLoadingSubscriptions]);

  useEffect(() => {
    if (!user || !subscriptionsCloudReady || isLoadingSubscriptions) return;
    const timer = setTimeout(() => {
      upsertRows("subscriptions", user.id, subscriptions.map(subscriptionToRow)).catch(
        () => setSubscriptionsStorageError("Subscriptions could not be synced.")
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [user, subscriptions, subscriptionsCloudReady, isLoadingSubscriptions]);

  const saveSubscription = useCallback((subscription) => {
    const amount = Number(subscription.amount);
    if (
      !subscription.name?.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return false;
    }
    setSubscriptions((current) => {
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
    return true;
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
    if (user) {
      deleteRow("subscriptions", user.id, id).catch(() =>
        setSubscriptionsStorageError("The subscription could not be deleted from the cloud.")
      );
    }
  }, [user]);

  const loadDemoSubscriptions = useCallback(
    () => setSubscriptions(demoSubscriptions),
    []
  );

  const resetSubscriptions = useCallback(() => setSubscriptions([]), []);

  const value = useMemo(
    () => ({
      subscriptions,
      isLoadingSubscriptions,
      subscriptionsStorageError,
      saveSubscription,
      toggleSubscription,
      deleteSubscription,
      loadDemoSubscriptions,
      resetSubscriptions,
    }),
    [
      subscriptions,
      isLoadingSubscriptions,
      subscriptionsStorageError,
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
