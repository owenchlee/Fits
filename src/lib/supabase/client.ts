import { combineChunks, createBrowserClient, stringFromBase64URL } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
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

/**
 * Reads the saved session straight from storage without validating or refreshing it, so the UI can
 * open instantly while supabase-js refreshes an expired token over a slow or missing connection.
 */
export async function readStoredSession(): Promise<Session | null> {
  try {
    let raw: string | null | undefined;
    if (Capacitor.isNativePlatform()) {
      const { keys } = await Preferences.keys();
      const key = keys.find((k) => /^sb-.+-auth-token$/.test(k));
      raw = key ? (await Preferences.get({ key })).value : null;
    } else {
      const jar = new Map(
        document.cookie
          .split("; ")
          .filter(Boolean)
          .map((c) => [c.slice(0, c.indexOf("=")), decodeURIComponent(c.slice(c.indexOf("=") + 1))] as const)
      );
      const base = [...jar.keys()]
        .map((k) => k.match(/^(sb-.+-auth-token)(\.\d+)?$/)?.[1])
        .find(Boolean);
      raw = base ? await combineChunks(base, (name) => jar.get(name)) : null;
      if (raw?.startsWith("base64-")) raw = stringFromBase64URL(raw.slice(7));
    }
    const session = raw ? (JSON.parse(raw) as Session) : null;
    return session?.access_token && session.refresh_token && session.user ? session : null;
  } catch {
    return null;
  }
}
