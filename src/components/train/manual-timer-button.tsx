"use client";

import * as React from "react";
import { Timer } from "@phosphor-icons/react/dist/ssr";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRestTimer } from "@/lib/timer/rest-timer-context";
import { useSettings } from "@/lib/db/hooks";
import { cn } from "@/lib/utils";

const PRESETS = [30, 60, 90, 120, 180, 240];

export function ManualTimerButton() {
  const [open, setOpen] = React.useState(false);
  const timer = useRestTimer();
  const settings = useSettings();
  const active = timer.totalSeconds > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Start rest timer"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground",
            active && "text-primary"
          )}
        >
          <Timer size={18} weight={active ? "fill" : "regular"} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <p className="text-xs font-medium text-muted-foreground">Start rest timer</p>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5">
          {PRESETS.map((seconds) => (
            <button
              key={seconds}
              type="button"
              onClick={() => {
                timer.start(seconds);
                setOpen(false);
              }}
              className="rounded-lg bg-secondary py-2 text-sm font-medium tabular-nums text-secondary-foreground hover:bg-muted"
            >
              {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
            </button>
          ))}
        </div>
        {active && (
          <button
            type="button"
            onClick={() => {
              timer.stop();
              setOpen(false);
            }}
            className="mt-1.5 w-full rounded-lg py-1.5 text-xs font-medium text-destructive hover:bg-secondary"
          >
            Stop timer
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            timer.start(settings.defaultRestSeconds);
            setOpen(false);
          }}
          className="mt-1.5 w-full rounded-lg py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
        >
          Use default ({settings.defaultRestSeconds}s)
        </button>
      </PopoverContent>
    </Popover>
  );
}
