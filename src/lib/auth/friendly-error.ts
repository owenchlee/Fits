import type { AuthError } from "@supabase/supabase-js";

/**
 * Supabase-js surfaces a raw network failure (e.g. "Failed to fetch", "Load failed") as a
 * generic AuthError rather than throwing, since it can't tell "no internet" apart from other
 * fetch failures. That raw string reads like a bug report to a user in a native app with no
 * connection, so map it to a plain-language message instead.
 */
export function authErrorMessage(error: AuthError): string {
  const raw = error.message.toLowerCase();
  if (raw.includes("fetch") || raw.includes("network") || raw.includes("load failed")) {
    return "Check your internet connection and try again.";
  }
  return error.message;
}
