import { createBrowserClient } from "@supabase/ssr";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { Database } from "./types";

/**
 * Inside the native Capacitor WebView, persist the session via Preferences (native on-device
 * storage) rather than the default cookie jar — WKWebView/Android WebView cookie stores are more
 * prone to eviction than a real browser's, so this survives app restarts more reliably. The web
 * build keeps the default cookie-based storage (needed so proxy.ts can read/refresh the session
 * server-side); the Supabase client refreshes its own tokens client-side either way.
 */
const nativeStorageAdapter = {
  async getItem(key: string) {
    const { value } = await Preferences.get({ key });
    return value;
  },
  async setItem(key: string, value: string) {
    await Preferences.set({ key, value });
  },
  async removeItem(key: string) {
    await Preferences.remove({ key });
  },
};

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Capacitor.isNativePlatform() ? { auth: { storage: nativeStorageAdapter } } : undefined
  );
}
