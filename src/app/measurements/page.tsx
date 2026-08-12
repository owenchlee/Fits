"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus, Ruler, Trash } from "@phosphor-icons/react/dist/ssr";
import { useBodyMetrics, useSettings } from "@/lib/db/hooks";
import { logBodyMetric, deleteBodyMetric } from "@/lib/db/repo";
import { fromDisplayWeight, formatWeight, toDisplayWeight } from "@/lib/calc/units";
import { sanitizeDecimalInput } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendChart, type TrendPoint } from "@/components/charts/trend-chart";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MEASUREMENT_FIELDS = ["chest", "waist", "hips", "thigh", "arm", "calf", "shoulders"] as const;

export default function MeasurementsPage() {
  const settings = useSettings();
  const metrics = useBodyMetrics();
  const [open, setOpen] = React.useState(false);
  const [weight, setWeight] = React.useState("");
  const [bodyFat, setBodyFat] = React.useState("");
  const [measurements, setMeasurements] = React.useState<Record<string, string>>({});

  const chartData: TrendPoint[] = [...metrics]
    .filter((m) => m.weightKg)
    .reverse()
    .map((m) => ({
      date: new Date(m.date).toISOString(),
      value: Math.round(toDisplayWeight(m.weightKg!, settings.unitSystem) * 10) / 10,
      label: new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));

  async function handleSave() {
    const weightKg = weight ? fromDisplayWeight(parseFloat(weight), settings.unitSystem) : undefined;
    const parsedMeasurements: Record<string, number> = {};
    for (const [k, v] of Object.entries(measurements)) {
      const n = parseFloat(v);
      if (Number.isFinite(n)) parsedMeasurements[k] = n;
    }
    await logBodyMetric({
      date: Date.now(),
      weightKg,
      bodyFatPct: bodyFat ? parseFloat(bodyFat) : undefined,
      measurements: Object.keys(parsedMeasurements).length ? parsedMeasurements : undefined,
    });
    toast.success("Entry logged");
    setOpen(false);
    setWeight("");
    setBodyFat("");
    setMeasurements({});
  }

  return (
    <div className="pb-6">
      <PageHeader
        title="Measurements"
        description="Track bodyweight and body measurements over time."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus size={16} /> Log entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log measurements</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="weight" className="mb-1.5 block text-xs text-muted-foreground">
                    Bodyweight ({settings.unitSystem})
                  </Label>
                  <input
                    id="weight"
                    inputMode="decimal"
                    value={weight}
                    onChange={(e) => setWeight(sanitizeDecimalInput(e.target.value))}
                    className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm tabular-nums focus:border-ring focus:outline-none"
                  />
                </div>
                <div>
                  <Label htmlFor="bodyfat" className="mb-1.5 block text-xs text-muted-foreground">
                    Body fat %
                  </Label>
                  <input
                    id="bodyfat"
                    inputMode="decimal"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(sanitizeDecimalInput(e.target.value))}
                    className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm tabular-nums focus:border-ring focus:outline-none"
                  />
                </div>
                {MEASUREMENT_FIELDS.map((field) => (
                  <div key={field}>
                    <Label htmlFor={field} className="mb-1.5 block text-xs capitalize text-muted-foreground">
                      {field} ({settings.unitSystem === "kg" ? "cm" : "in"})
                    </Label>
                    <input
                      id={field}
                      inputMode="decimal"
                      value={measurements[field] ?? ""}
                      onChange={(e) =>
                        setMeasurements((prev) => ({ ...prev, [field]: sanitizeDecimalInput(e.target.value) }))
                      }
                      className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm tabular-nums focus:border-ring focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={!weight && Object.values(measurements).every((v) => !v)}>
                  Save entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <section className="mb-6 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 font-display text-lg font-bold">Bodyweight trend</h2>
        <TrendChart data={chartData} unitLabel={settings.unitSystem} emptyLabel="No bodyweight logs yet" />
      </section>

      {metrics.length === 0 ? (
        <EmptyState
          icon={Ruler}
          title="Nothing on the tape yet"
          description="Log bodyweight or a measurement above to start tracking change over time."
        />
      ) : (
        <div className="space-y-2">
          {metrics.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.weightKg && formatWeight(m.weightKg, settings.unitSystem)}
                  {m.bodyFatPct && ` · ${m.bodyFatPct}% BF`}
                  {m.measurements &&
                    ` · ${Object.entries(m.measurements)
                      .map(([k, v]) => `${k} ${v}`)
                      .join(", ")}`}
                </p>
              </div>
              <button
                aria-label="Delete entry"
                onClick={() => deleteBodyMetric(m.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
