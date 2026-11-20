import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import { fetchWithClockSkewRetry } from "./fetch";

export function createClient() {
  const { url, anonKey } = getSupabaseConfig();
  return createBrowserClient(url, anonKey, {
    global: {
      fetch: fetchWithClockSkewRetry,
    },
  });
}
