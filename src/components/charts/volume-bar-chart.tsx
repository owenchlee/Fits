"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Barbell } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/shared/empty-state";

export interface VolumePoint {
  label: string;
  value: number;
}

function ChartTooltip({
  active,
  payload,
  unitLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: VolumePoint }>;
  unitLabel: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{point.label}</p>
      <p className="tabular-nums text-muted-foreground">
        {point.value.toLocaleString()} {unitLabel}
      </p>
    </div>
  );
}

export function VolumeBarChart({ data, unitLabel, height = 200 }: { data: VolumePoint[]; unitLabel: string; height?: number }) {
  if (data.every((d) => d.value === 0)) {
    return <EmptyState icon={Barbell} title="No volume logged yet" className="py-8" />;
  }

  return (
    <div style={{ width: "100%", height }} role="img" aria-label={`Bar chart of training volume across ${data.length} weeks`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<ChartTooltip unitLabel={unitLabel} />} cursor={{ fill: "var(--color-secondary)" }} />
          <Bar dataKey="value" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
