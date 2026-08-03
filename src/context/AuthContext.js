import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../lib/supabase";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_ONBOARDING_KEY = "@pocketwise/pending-onboarding/v1";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState(null);
  const [isPendingLoading, setIsPendingLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === "web" && globalThis.location?.hash) {
      const params = new URLSearchParams(globalThis.location.hash.slice(1));
      const description = params.get("error_description");
      if (description) {
        setAuthError(description.replace(/\+/g, " "));
        globalThis.history?.replaceState(
          {},
          globalThis.document?.title || "",
          globalThis.location.pathname
        );
      }
    }
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (mounted) setSession(data.session);
      })
      .catch(() => {
        if (mounted) setAuthError("Your account session could not be restored.");
      })
      .finally(() => {
        if (mounted) setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setIsDemo(false);
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(PENDING_ONBOARDING_KEY)
      .then((stored) => {
        if (stored) setPendingOnboarding(JSON.parse(stored));
      })
      .catch(() => {})
      .finally(() => setIsPendingLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    setAuthError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) {
      setAuthError(error.message);
      return { data: null, error };
    }
    return { data, error: null };
  }, []);

  const signUp = useCallback(async ({ email, password, name, school, budget }) => {
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo:
          Platform.OS === "web" ? globalThis.location?.origin : "pocketwise://",
        data: {
          name: name.trim(),
          school: school.trim(),
          monthly_budget: Number(budget) || 900,
        },
      },
    });
    if (error) {
      setAuthError(error.message);
    } else {
      const pending = {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        school: school.trim(),
        monthlyBudget: Number(budget) || 900,
      };
      setPendingOnboarding(pending);
      await AsyncStorage.setItem(
        PENDING_ONBOARDING_KEY,
        JSON.stringify(pending)
      );
    }
    return { data, error };
  }, []);

  const clearPendingOnboarding = useCallback(async () => {
    setPendingOnboarding(null);
    await AsyncStorage.removeItem(PENDING_ONBOARDING_KEY);
  }, []);

  const resendConfirmation = useCallback(async (email) => {
    setAuthError("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo:
          Platform.OS === "web" ? globalThis.location?.origin : "pocketwise://",
      },
    });
    if (error) setAuthError(error.message);
    return { error };
  }, []);

  const clearAuthError = useCallback(() => setAuthError(""), []);

  const signOut = useCallback(async () => {
    setAuthError("");
    setIsDemo(false);
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(error.message);
    return { error };
  }, []);

  const startDemo = useCallback(() => {
    setAuthError("");
    setIsDemo(true);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      isAuthLoading: isAuthLoading || isPendingLoading,
      authError,
      isDemo,
      signIn,
      signUp,
      signOut,
      startDemo,
      resendConfirmation,
      clearAuthError,
      pendingOnboarding,
      clearPendingOnboarding,
    }),
    [
      session,
      isAuthLoading,
      isPendingLoading,
      authError,
      isDemo,
      signIn,
      signUp,
      signOut,
      startDemo,
      resendConfirmation,
      clearAuthError,
      pendingOnboarding,
      clearPendingOnboarding,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
