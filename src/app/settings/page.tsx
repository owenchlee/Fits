"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Moon, Sun, Trash, Monitor } from "@phosphor-icons/react/dist/ssr";
import { useTheme } from "next-themes";
import { useSettings } from "@/lib/db/hooks";
import { updateSettings, exportAllData, resetAllData } from "@/lib/db/repo";
import { ensureSeeded, resetSeedState } from "@/lib/db/bootstrap";
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

export default function SettingsPage() {
  const router = useRouter();
  const settings = useSettings();
  const { theme, setTheme } = useTheme();

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
    await resetAllData();
    resetSeedState();
    await ensureSeeded();
    toast.success("All data reset");
    router.push("/");
  }

  return (
    <div className="max-w-lg space-y-4 pb-6">
      <PageHeader title="Settings" />

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
          Fits stores everything locally on this device — nothing leaves your browser.
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
                  This permanently deletes every workout, program, and measurement stored on this device. Export a
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
