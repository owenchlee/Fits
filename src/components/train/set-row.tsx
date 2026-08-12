"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DotsThreeVertical, Trash, Fire, Flask, ArrowsDownUp } from "@phosphor-icons/react/dist/ssr";
import { PlateCalculatorPopover } from "@/components/train/plate-calculator-popover";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toDisplayWeight, fromDisplayWeight } from "@/lib/calc/units";
import { sanitizeDecimalInput, sanitizeIntegerInput } from "@/lib/format";
import type { SetEntry, UnitSystem } from "@/lib/db/types";
import { cn } from "@/lib/utils";

const RPE_OPTIONS = ["—", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"];

export function SetRow({
  index,
  unit,
  set,
  previous,
  onChange,
  onDelete,
}: {
  index: number;
  unit: UnitSystem;
  set: SetEntry;
  previous?: { weightKg: number; reps: number };
  onChange: (patch: Partial<SetEntry>) => void;
  onDelete: () => void;
}) {
  const [weightStr, setWeightStr] = React.useState(() =>
    set.weightKg ? String(round1(toDisplayWeight(set.weightKg, unit))) : ""
  );
  const [repsStr, setRepsStr] = React.useState(() => (set.reps ? String(set.reps) : ""));

  const isComplete = !set.isWarmup && set.weightKg > 0 && set.reps > 0;
  const wasComplete = React.useRef(isComplete);
  const [justCompleted, setJustCompleted] = React.useState(false);

  React.useEffect(() => {
    if (isComplete && !wasComplete.current) {
      setJustCompleted(true);
      const t = setTimeout(() => setJustCompleted(false), 550);
      wasComplete.current = isComplete;
      return () => clearTimeout(t);
    }
    wasComplete.current = isComplete;
  }, [isComplete]);

  function commitWeight(value: string) {
    const cleaned = sanitizeDecimalInput(value);
    setWeightStr(cleaned);
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n) && n >= 0) onChange({ weightKg: fromDisplayWeight(n, unit) });
  }

  function commitReps(value: string) {
    const cleaned = sanitizeIntegerInput(value);
    setRepsStr(cleaned);
    const n = parseInt(cleaned, 10);
    if (!Number.isNaN(n) && n >= 0) onChange({ reps: n });
  }

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 overflow-hidden rounded-xl px-2 py-1.5",
        set.isWarmup ? "opacity-70" : "bg-secondary/40"
      )}
    >
      <AnimatePresence>
        {justCompleted && (
          <motion.span
            className="pointer-events-none absolute inset-0 bg-primary"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          />
        )}
      </AnimatePresence>
      <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-muted-foreground">
        {set.isWarmup ? "W" : index}
      </span>

      <input
        inputMode="decimal"
        value={weightStr}
        onChange={(e) => commitWeight(e.target.value)}
        placeholder={previous ? String(round1(toDisplayWeight(previous.weightKg, unit))) : "0"}
        aria-label={`Set ${index} weight (${unit})`}
        className="h-9 w-16 rounded-lg border border-transparent bg-secondary px-2 text-center text-sm font-medium tabular-nums placeholder:font-normal placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:outline-none"
      />
      <span className="text-xs text-muted-foreground">×</span>
      <input
        inputMode="numeric"
        value={repsStr}
        onChange={(e) => commitReps(e.target.value)}
        placeholder={previous ? String(previous.reps) : "0"}
        aria-label={`Set ${index} reps`}
        className="h-9 w-12 rounded-lg border border-transparent bg-secondary px-2 text-center text-sm font-medium tabular-nums placeholder:font-normal placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:outline-none"
      />

      <PlateCalculatorPopover weight={toDisplayWeight(set.weightKg, unit)} unit={unit} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Set ${index} options`}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <DotsThreeVertical size={16} weight="bold" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">RPE</p>
            <div className="flex flex-wrap gap-1">
              {RPE_OPTIONS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange({ rpe: v === "—" ? undefined : parseFloat(v) })}
                  className={cn(
                    "rounded-md px-1.5 py-1 text-xs tabular-nums",
                    (set.rpe ? String(set.rpe) : "—") === v
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={set.isWarmup}
            onCheckedChange={(v) => onChange({ isWarmup: v })}
          >
            <Flask size={14} className="mr-1.5" /> Warm-up
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={set.isFailure}
            onCheckedChange={(v) => onChange({ isFailure: v })}
          >
            <Fire size={14} className="mr-1.5" /> To failure
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={set.isDropSet}
            onCheckedChange={(v) => onChange({ isDropSet: v })}
          >
            <ArrowsDownUp size={14} className="mr-1.5" /> Drop set
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash size={14} className="mr-1.5" /> Delete set
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
