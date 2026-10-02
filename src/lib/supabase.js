import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey
);
export async function clearPersistedSession() {
  if (!supabaseConfigured) return;
  const project = new URL(supabaseUrl).hostname.split('.')[0];
  const key = `sb-${project}-auth-token`;
  await AsyncStorage.multiRemove([key, `${key}-code-verifier`, `${key}-user`]);
}

const unavailable = async () => ({ data: {}, error: new Error('Cloud accounts are unavailable. Configure Supabase or use the isolated demo.') });
const demoOnlyClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: unavailable, signUp: unavailable, resend: unavailable,
    resetPasswordForEmail: unavailable, updateUser: unavailable,
    exchangeCodeForSession: unavailable, setSession: unavailable,
    signOut: async () => ({ error: null }),
  },
};

export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce',
    detectSessionInUrl: Platform.OS === "web",
  },
}) : demoOnlyClient;

if (supabaseConfigured && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
