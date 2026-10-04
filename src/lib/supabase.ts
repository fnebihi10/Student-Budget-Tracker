import type { Database } from '../services/database';
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
  if (!supabaseUrl) return;
  const project = new URL(supabaseUrl).hostname.split('.')[0];
  const key = `sb-${project}-auth-token`;
  await AsyncStorage.multiRemove([key, `${key}-code-verifier`, `${key}-user`]);
}

export const supabase = createClient<Database>(supabaseUrl || 'https://demo.invalid', supabasePublishableKey || 'demo-only', {
  ...(!supabaseConfigured ? { global: { fetch: async () => { throw new Error('Cloud accounts are unavailable. Configure Supabase or use the isolated demo.'); } } } : {}),
  auth: {
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: supabaseConfigured,
    persistSession: supabaseConfigured,
    flowType: 'pkce',
    detectSessionInUrl: Platform.OS === "web",
  },
});

if (supabaseConfigured && Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
