import type { SupabaseClient, User } from "@supabase/supabase-js";
import { LEGAL_VERSION } from "@/lib/legal";

/**
 * Records which version of the Terms / Privacy Policy someone agreed to. Kept locally per identity
 * (so a guest's acceptance doesn't carry over to a different account on a shared device) and, for
 * accounts, also in Supabase auth user_metadata so it follows the user to every device.
 */
const keyFor = (identity: string) => `fits-legal-accepted:${identity}`;
const listeners = new Set<() => void>();

export const METADATA_KEY = "accepted_legal_version";

function readLocal(identity: string): string | null {
  try {
    return localStorage.getItem(keyFor(identity));
  } catch {
    return null;
  }
}

export const legalConsentStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  /** Snapshot is the accepted version for `identity` — a primitive, so useSyncExternalStore stays stable. */
  getSnapshot(identity: string): string | null {
    return readLocal(identity);
  },
};

export function hasAcceptedCurrentTerms(user: User | null, localVersion: string | null): boolean {
  if (localVersion === LEGAL_VERSION) return true;
  return user?.user_metadata?.[METADATA_KEY] === LEGAL_VERSION;
}

/** Metadata to attach at sign-up, so the agreement made on the sign-up form is on the account from the start. */
export function acceptanceMetadata() {
  return { [METADATA_KEY]: LEGAL_VERSION, accepted_legal_at: new Date().toISOString() };
}

export async function recordAcceptance(supabase: SupabaseClient | null, user: User | null) {
  try {
    localStorage.setItem(keyFor(user?.id ?? "guest"), LEGAL_VERSION);
  } catch {
    // Storage blocked — the account metadata below (if any) still records it.
  }
  for (const listener of listeners) listener();
  if (supabase && user) {
    // Best effort: offline, the local record above is enough for this device, and the user simply
    // confirms again (one tap) the first time they open Fits on another device.
    await supabase.auth.updateUser({ data: acceptanceMetadata() }).catch(() => {});
  }
}

export function markAcceptedLocally(identity: string) {
  try {
    localStorage.setItem(keyFor(identity), LEGAL_VERSION);
  } catch {
    // ignore
  }
  for (const listener of listeners) listener();
}
