const PHRASES: [string, string][] = [
  ["military press", "overhead press"],
  ["ohp", "overhead press"],
  ["rdl", "romanian deadlift"],
  ["db", "dumbbell"],
  ["bb", "barbell"],
  ["farmer walk", "farmer carry"],
  ["bicep", ""],
];

// Trailing "s" is stripped on both sides, so "squats" / "triceps" / "press" all compare consistently.
const singular = (w: string) => (w.length > 2 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map(singular);
}

/** Filters exercises by a forgiving name search (plurals, missing hyphens/spaces, common abbreviations), best matches first. */
export function searchExercises<T extends { name: string }>(exercises: T[], query: string): T[] {
  let q = tokens(query).join(" ");
  if (!q) return exercises;
  for (const [from, to] of PHRASES) q = ` ${q} `.replace(new RegExp(` ${from} `, "g"), ` ${to} `).trim();
  const qTokens = q.split(" ").filter(Boolean);
  if (!qTokens.length) return exercises;
  const qJoined = qTokens.join("");
  const scored: [number, T][] = [];
  for (const e of exercises) {
    const nameTokens = tokens(e.name);
    const compact = nameTokens.join("");
    if (!qTokens.every((t) => compact.includes(t))) continue;
    const score = compact === qJoined ? 0 : compact.startsWith(qJoined) ? 1 : nameTokens.some((t) => t.startsWith(qTokens[0])) ? 2 : 3;
    scored.push([score, e]);
  }
  return scored.sort((a, b) => a[0] - b[0]).map(([, e]) => e);
}
