/**
 * Guest mode: using Fits without an account. Data then lives only in this device's IndexedDB,
 * exactly as it does for a signed-in user minus the sync — so it's just a persisted flag, kept in
 * localStorage next to that data (clearing site data wipes both together).
 *
 * Exposed as a tiny external store so components read it with useSyncExternalStore.
 */
const KEY = "fits-guest-mode";
const listeners = new Set<() => void>();
let memory: boolean | null = null;

function read(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function write(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: guest mode still works for this session, it just won't survive a relaunch.
  }
  memory = enabled;
  for (const listener of listeners) listener();
}

export const guestModeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  getSnapshot(): boolean {
    if (memory === null) memory = read();
    return memory;
  },
  getServerSnapshot(): boolean {
    return false;
  },
  enable() {
    write(true);
  },
  disable() {
    write(false);
  },
};
