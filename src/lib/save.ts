import { toast } from "sonner";

/**
 * Runs a write and tells the lifter if it failed. Resolves true on success,
 * false on failure, so callers can skip navigation after a failed save.
 */
export async function saveOrToast<T>(write: () => Promise<T>): Promise<boolean> {
  try {
    await write();
    return true;
  } catch {
    toast.error("Couldn't save. Please try again.");
    return false;
  }
}
