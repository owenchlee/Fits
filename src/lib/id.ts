export function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Deterministic id for seeded built-in content (exercises, programs, program days). Built-ins are
 * re-seeded independently on every device (see bootstrap.ts) rather than synced to the backend, so
 * they need the *same* id everywhere a slug (unlike generateId()'s random ids) already guarantees.
 */
export function slugId(prefix: string, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${prefix}-${slug}`;
}
