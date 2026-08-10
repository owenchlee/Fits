"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { calculatePlates } from "@/lib/calc/plates";
import { PLATE_PRESETS, PLATE_COLORS } from "@/lib/calc/plate-presets";
import type { UnitSystem } from "@/lib/db/types";
import { Rows } from "@phosphor-icons/react/dist/ssr";

export function PlateCalculatorPopover({ weight, unit }: { weight: number; unit: UnitSystem }) {
  const preset = PLATE_PRESETS[unit];
  const result = calculatePlates(weight, preset.bar, preset.plates);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Show plate breakdown"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Rows size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <p className="text-xs font-medium text-muted-foreground">
          Per side · {preset.bar}
          {unit} bar
        </p>
        {result.perSide.length === 0 ? (
          <p className="mt-1.5 text-sm">Just the bar</p>
        ) : (
          <div className="mt-2 flex flex-wrap items-end gap-1">
            {result.perSide.map((plate, i) => (
              <div
                key={i}
                className={`flex w-6 items-center justify-center rounded-sm text-[9px] font-bold text-white ${PLATE_COLORS[plate] ?? "bg-muted-foreground/40"}`}
                style={{ height: `${28 + plate}px` }}
              >
                {plate}
              </div>
            ))}
          </div>
        )}
        {!result.reachable && (
          <p className="mt-2 text-xs text-destructive">Can&apos;t hit this exactly with available plates.</p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Loads to {result.actualWeight}
          {unit}
        </p>
      </PopoverContent>
    </Popover>
  );
}
