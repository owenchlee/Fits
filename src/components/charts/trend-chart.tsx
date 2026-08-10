"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/shared/empty-state";

export interface TrendPoint {
  date: string;
  value: number;
  label: string;
}

function ChartTooltip({
  active,
  payload,
  unitLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: TrendPoint }>;
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

export function TrendChart({
  data,
  unitLabel,
  emptyLabel = "No data yet",
  height = 220,
}: {
  data: TrendPoint[];
  unitLabel: string;
  emptyLabel?: string;
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <EmptyState
        icon={ChartLineUp}
        title={emptyLabel}
        description="Log a couple more sessions to see your trend line."
        className="py-8"
      />
    );
  }

  return (
    <div style={{ width: "100%", height }} role="img" aria-label={`Trend chart of ${data.length} data points in ${unitLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip content={<ChartTooltip unitLabel={unitLabel} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            fill="url(#trendFill)"
            dot={{ r: 3, fill: "var(--color-primary)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
