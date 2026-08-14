"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarBlank, BookOpenText, CaretRight, Download, Moon, Sun, Trash, Monitor, SignOut } from "@phosphor-icons/react/dist/ssr";
import { useTheme } from "next-themes";
import { db } from "@/lib/db/db";
import { useSettings } from "@/lib/db/hooks";
import { updateSettings, exportAllData, resetAllData } from "@/lib/db/repo";
import { ensureSeeded, resetSeedState } from "@/lib/db/bootstrap";
import { useAuth } from "@/lib/auth/auth-provider";
import { enqueueSync } from "@/lib/sync/outbox";
import { flushOutbox } from "@/lib/sync/engine";
import { shouldSyncExercise, shouldSyncProgram } from "@/lib/sync/tables";
import { sanitizeIntegerInput } from "@/lib/format";
import type { Sex, UnitSystem } from "@/lib/db/types";
import { PageHeader } from "@/components/shared/page-header";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const REST_PRESETS = [60, 90, 120, 150, 180, 240];

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function CustomRestDuration({ seconds, onChange }: { seconds: number; onChange: (seconds: number) => void }) {
  const [prevSeconds, setPrevSeconds] = React.useState(seconds);
  const [minutes, setMinutes] = React.useState(String(Math.floor(seconds / 60)));
  const [secs, setSecs] = React.useState(String(seconds % 60).padStart(2, "0"));

  if (seconds !== prevSeconds) {
    setPrevSeconds(seconds);
    setMinutes(String(Math.floor(seconds / 60)));
    setSecs(String(seconds % 60).padStart(2, "0"));
  }

  function commit(nextMinutes: string, nextSecs: string) {
    const m = Math.max(0, parseInt(nextMinutes, 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(nextSecs, 10) || 0));
    const total = m * 60 + s;
    if (total > 0) onChange(total);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        inputMode="numeric"
        value={minutes}
        onChange={(e) => setMinutes(sanitizeIntegerInput(e.target.value))}
        onBlur={() => commit(minutes, secs)}
        aria-label="Rest duration minutes"
        className="h-9 w-16 rounded-lg border border-transparent bg-secondary px-2 text-center text-sm font-medium tabular-nums focus:border-ring focus:bg-background focus:outline-none"
      />
      <span className="text-sm text-muted-foreground">min</span>
      <input
        inputMode="numeric"
        value={secs}
        onChange={(e) => setSecs(sanitizeIntegerInput(e.target.value))}
        onBlur={() => commit(minutes, secs)}
        aria-label="Rest duration seconds"
        className="h-9 w-16 rounded-lg border border-transparent bg-secondary px-2 text-center text-sm font-medium tabular-nums focus:border-ring focus:outline-none"
      />
      <span className="text-sm text-muted-foreground">sec</span>
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg py-2 text-sm font-medium capitalize transition-colors",
            value === o.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const settings = useSettings();
  const { theme, setTheme } = useTheme();
  const { user, signOut, supabase } = useAuth();

  function handleExport() {
    exportAllData().then((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fits-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    });
  }

  async function handleReset() {
    if (user) {
      // Reset should really mean reset — also queue deletes for the cloud copy, otherwise the
      // next sync would just pull everything back down again.
      const [exercises, programs, workouts, sets, bodyMetrics] = await Promise.all([
        db.exercises.filter(shouldSyncExercise).toArray(),
        db.programs.filter(shouldSyncProgram).toArray(),
        db.workouts.toArray(),
        db.sets.toArray(),
        db.bodyMetrics.toArray(),
      ]);
      for (const e of exercises) await enqueueSync("exercises", "delete", e.id);
      for (const p of programs) await enqueueSync("programs", "delete", p.id);
      for (const w of workouts) await enqueueSync("workouts", "delete", w.id);
      for (const s of sets) await enqueueSync("sets", "delete", s.id);
      for (const b of bodyMetrics) await enqueueSync("bodyMetrics", "delete", b.id);
      await flushOutbox(supabase, user.id);
    }
    await resetAllData();
    resetSeedState();
    await ensureSeeded();
    toast.success("All data reset");
    router.push("/");
  }

  return (
    <div className="max-w-lg space-y-4 pb-6">
      <PageHeader title="Profile" />

      <SettingsSection title="Account">
        <p className="mb-3 text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{user?.email}</span>. Your data syncs automatically across
          every device you log in on.
        </p>
        <Button variant="outline" onClick={() => void signOut()}>
          <SignOut size={15} /> Log out
        </Button>
      </SettingsSection>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <Link href="/calendar" className="flex items-center justify-between gap-2 px-4 py-3.5 hover:bg-secondary/60">
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <CalendarBlank size={18} className="text-muted-foreground" /> Calendar
          </span>
          <CaretRight size={14} className="text-muted-foreground" />
        </Link>
        <div className="h-px bg-border" />
        <Link href="/exercises" className="flex items-center justify-between gap-2 px-4 py-3.5 hover:bg-secondary/60">
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <BookOpenText size={18} className="text-muted-foreground" /> Exercise Library
          </span>
          <CaretRight size={14} className="text-muted-foreground" />
        </Link>
      </section>

      <SettingsSection title="Units">
        <Label className="mb-1.5 block text-xs text-muted-foreground">Weight unit</Label>
        <SegmentedControl<UnitSystem>
          value={settings.unitSystem}
          onChange={(v) => updateSettings({ unitSystem: v })}
          options={[
            { value: "lb", label: "Pounds (lb)" },
            { value: "kg", label: "Kilograms (kg)" },
          ]}
        />
      </SettingsSection>

      <SettingsSection title="Percentile calculator">
        <Label className="mb-1.5 block text-xs text-muted-foreground">Sex (used for strength standards)</Label>
        <SegmentedControl<Sex>
          value={settings.sex}
          onChange={(v) => updateSettings({ sex: v })}
          options={[
            { value: "male", label: "Male" },
            { value: "female", label: "Female" },
          ]}
        />
      </SettingsSection>

      <SettingsSection title="Rest timer">
        <Label className="mb-1.5 block text-xs text-muted-foreground">Default rest duration</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {REST_PRESETS.map((seconds) => (
            <button
              key={seconds}
              onClick={() => updateSettings({ defaultRestSeconds: seconds })}
              className={cn(
                "rounded-lg py-2 text-sm font-medium tabular-nums transition-colors",
                settings.defaultRestSeconds === seconds
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              )}
            >
              {seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}
            </button>
          ))}
        </div>

        <Label className="mb-1.5 mt-3 block text-xs text-muted-foreground">Custom duration</Label>
        <CustomRestDuration
          seconds={settings.defaultRestSeconds}
          onChange={(seconds) => updateSettings({ defaultRestSeconds: seconds })}
        />
      </SettingsSection>

      <SettingsSection title="Appearance">
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setTheme("light")}
            suppressHydrationWarning
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
              theme === "light" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <Sun size={15} /> Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            suppressHydrationWarning
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
              theme === "dark" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <Moon size={15} /> Dark
          </button>
          <button
            onClick={() => setTheme("system")}
            suppressHydrationWarning
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors",
              theme === "system" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            )}
          >
            <Monitor size={15} /> Auto
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Your data">
        <p className="mb-3 text-sm text-muted-foreground">
          Fits keeps a local copy on this device for offline use, synced to your account in the background.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download size={15} /> Export as JSON
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash size={15} /> Reset all data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes every workout, program, and measurement{user ? " — on this device and in your synced account" : " stored on this device"}. Export a
                  backup first if you want to keep it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleReset}>
                  Reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsSection>
    </div>
  );
}
