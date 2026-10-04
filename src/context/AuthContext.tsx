import type { Session } from '@supabase/supabase-js';
import { object } from '../services/decoders';
import { positiveMoney } from '../domain/finance';
import type { PropsWithChildren } from 'react';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase, clearPersistedSession } from "../lib/supabase";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteOwnAccount } from "../services/cloudData";
import { invalidateFinanceStores } from '../services/confirmedStore';
import { clearScopeCache } from '../services/scopedCache';
type PendingOnboarding = { email: string; name: string; school: string; monthlyBudget: number };
type Signup = { email: string; password: string; name: string; school: string; budget: string | number };

const PENDING_ONBOARDING_KEY = "@pocketwise/pending-onboarding/v1";

const initialAuthError = () => {
  if (Platform.OS !== "web" || !globalThis.location?.hash) return "";
  const params = new URLSearchParams(globalThis.location.hash.slice(1));
  return (params.get("error_description") || "").replace(/\+/g, " ");
};

export const AuthContext = createContext<ReturnType<typeof useAuthValue> | undefined>(undefined);

function useAuthValue() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(initialAuthError);
  const [isDemo, setIsDemo] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [pendingOnboarding, setPendingOnboarding] = useState<PendingOnboarding | null>(null);
  const [isPendingLoading, setIsPendingLoading] = useState(true);
  const authEpoch = useRef(0);
  const identity = useRef<string | null>(null);
  const authBlocked = useRef(false);
  const endingSession = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (Platform.OS === "web" && globalThis.location?.hash) {
      const params = new URLSearchParams(globalThis.location.hash.slice(1));
      if (params.get("error_description")) {
        globalThis.history?.replaceState(
          {},
          globalThis.document?.title || "",
          globalThis.location.pathname
        );
      }
    }
    const epoch = authEpoch.current;
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (mounted && epoch === authEpoch.current) {
          identity.current = data.session?.user?.id || null;
          setSession(data.session);
        }
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
      if (authBlocked.current && nextSession) return;
      authEpoch.current++;
      const nextIdentity = nextSession?.user?.id || null;
      if (identity.current !== nextIdentity) void invalidateFinanceStores();
      identity.current = nextIdentity;
      setSession(nextSession);
      if (_event === 'PASSWORD_RECOVERY') setIsRecovering(true);
      if (!nextSession) setIsRecovering(false);
      if (nextSession) setIsDemo(false);
      setIsAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let live = true;
    const handle = async (url: string | null) => {
      if (!url || !live) return;
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'pocketwise:' || parsed.hostname !== 'auth') return;
        const params = new URLSearchParams(parsed.hash.slice(1));
        const code = parsed.searchParams.get('code');
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) throw error;
        } else if (params.get('error_description')) throw new Error('Link expired');
        if (live && (params.get('type') === 'recovery' || parsed.searchParams.get('recovery') === '1')) setIsRecovering(true);
      } catch {
        if (live) setAuthError('This account link could not be opened. Request a new link and use the device where you requested it.');
      }
    };
    void Linking.getInitialURL().then(handle).catch(() => {
      if (live) setAuthError('The initial account link could not be read. Request a new link.');
    });
    const listener = Linking.addEventListener('url', ({ url }) => { void handle(url); });
    return () => { live = false; listener.remove(); };
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(PENDING_ONBOARDING_KEY)
      .then((stored) => {
        if (stored) {
          const record = object(JSON.parse(stored));
          if (typeof record.email !== 'string' || typeof record.name !== 'string' || typeof record.school !== 'string') throw new Error('Invalid onboarding cache.');
          setPendingOnboarding({ email: record.email, name: record.name, school: record.school, monthlyBudget: positiveMoney(record.monthlyBudget) });
        }
      })
      .catch(() => {})
      .finally(() => setIsPendingLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (endingSession.current) return { data: null, error: new Error('Your previous session is still closing. Try again shortly.') };
    authBlocked.current = false;
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

  const signUp = useCallback(async ({ email, password, name, school, budget }: Signup) => {
    if (endingSession.current) return { data: null, error: new Error('Your previous session is still closing. Try again shortly.') };
    authBlocked.current = false;
    setAuthError("");
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo:
          Platform.OS === "web" ? globalThis.location?.origin : "pocketwise://auth",
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

  const resendConfirmation = useCallback(async (email: string) => {
    setAuthError("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo:
          Platform.OS === "web" ? globalThis.location?.origin : "pocketwise://auth",
      },
    });
    if (error) setAuthError(error.message);
    return { error };
  }, []);

  const clearAuthError = useCallback(() => setAuthError(""), []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (endingSession.current) return { error: new Error('Your previous session is still closing. Try again shortly.') };
    authBlocked.current = false;
    setAuthError('');
    const redirectTo = Platform.OS === 'web' ? `${globalThis.location?.origin}/?recovery=1` : 'pocketwise://auth?recovery=1';
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    if (error) setAuthError(error.message);
    return { error };
  }, []);
  const finishPasswordReset = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setAuthError(error.message);
    else { setIsRecovering(false); setAuthError(''); }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    endingSession.current = true;
    setAuthError("");
    authEpoch.current++;
    identity.current = null;
    authBlocked.current = true;
    void invalidateFinanceStores();
    setSession(null);
    setIsRecovering(false);
    setIsDemo(false);
    let error: Error | null = null;
    try {
      ({ error } = await supabase.auth.signOut());
      await clearPersistedSession();
    } catch (cause) { error = cause instanceof Error ? cause : new Error("Session cleanup failed."); }
    finally { endingSession.current = false; }
    if (error) setAuthError(error.message);
    return { error };
  }, []);

  const startDemo = useCallback(() => {
    if (identity.current || endingSession.current) return;
    void invalidateFinanceStores();
    setAuthError("");
    setIsDemo(true);
  }, []);

  const deleteAccount = useCallback(async () => {
    setAuthError("");
    const accountId = identity.current;
    if (!accountId) return { error: new Error('Authentication required') };
    endingSession.current = true;
    // Stop edits before deletion. In-flight cache writes must drain before erase.
    const drained = invalidateFinanceStores();
    authEpoch.current++;
    identity.current = null;
    authBlocked.current = true;
    setSession(null);
    const { error } = await Promise.resolve()
      .then(() => deleteOwnAccount())
      .then(async () => {
        await clearPersistedSession();
        await drained;
        await clearScopeCache(`user/${accountId}`);
        await AsyncStorage.removeItem(PENDING_ONBOARDING_KEY);
        setPendingOnboarding(null);
      })
      .then(() => ({ error: null }))
      .catch((error) => ({ error }));
    endingSession.current = false;
    if (error) setAuthError(error.message || "Your account could not be deleted.");
    return { error };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      isAuthLoading: isAuthLoading || isPendingLoading,
      authError,
      isDemo,
      isRecovering,
      requestPasswordReset,
      finishPasswordReset,
      signIn,
      signUp,
      signOut,
      startDemo,
      deleteAccount,
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
      isRecovering,
      requestPasswordReset,
      finishPasswordReset,
      signIn,
      signUp,
      signOut,
      startDemo,
      deleteAccount,
      resendConfirmation,
      clearAuthError,
      pendingOnboarding,
      clearPendingOnboarding,
    ]
  );

  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const value = useAuthValue();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
