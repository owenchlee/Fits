import type { UnitSystem } from "@/lib/db/types";

export const PLATE_PRESETS: Record<UnitSystem, { bar: number; plates: number[] }> = {
  kg: { bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] },
  lb: { bar: 45, plates: [45, 35, 25, 10, 5, 2.5] },
};

export const PLATE_COLORS: Record<number, string> = {
  45: "bg-highlight/80",
  25: "bg-primary/70",
  20: "bg-primary/70",
  35: "bg-destructive/70",
  15: "bg-success/70",
  10: "bg-muted-foreground/60",
  5: "bg-muted-foreground/40",
  2.5: "bg-muted-foreground/30",
  1.25: "bg-muted-foreground/20",
};
