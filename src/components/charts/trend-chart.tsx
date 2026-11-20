"use client";

import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/shared/empty-state";
import { SvgChart, TooltipBox, monotonePath, niceTicks } from "./svg-chart";

export interface TrendPoint {
  date: string;
  value: number;
  label: string;
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

  const values = data.map((d) => d.value);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  // x is proportional to time; falls back to index spacing if dates are unparsable or identical
  const times = data.map((d) => Date.parse(d.date));
  const t0 = Math.min(...times);
  const span = Math.max(...times) - t0;
  const timed = Number.isFinite(span) && span > 0;
  const xs = (i: number, w: number) => (timed ? ((times[i] - t0) / span) * w : (i / (data.length - 1)) * w);
  const first = data[0];
  const last = data[data.length - 1];
  const summary = `Trend chart of ${data.length} data points in ${unitLabel}, from ${first.value.toLocaleString()} ${unitLabel} on ${first.label} to ${last.value.toLocaleString()} ${unitLabel} on ${last.label}`;

  return (
    <SvgChart
      height={height}
      label={summary}
      labels={data.map((d) => d.label)}
      ticks={ticks}
      yMin={ticks[0]}
      yMax={ticks[ticks.length - 1]}
      xs={xs}
      tooltip={(i) => <TooltipBox title={data[i].label} value={`${data[i].value.toLocaleString()} ${unitLabel}`} />}
    >
      {({ y, plotW, active }) => {
        const pts = data.map((d, i): [number, number] => [xs(i, plotW), y(d.value)]);
        const line = monotonePath(pts);
        const base = y(ticks[0]);
        return (
          <>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`${line}L${plotW},${base}L0,${base}Z`} fill="url(#trendFill)" />
            <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} />
            {pts.map(([x, yy], i) => (
              <circle key={i} cx={x} cy={yy} r={active === i ? 5 : 3} fill="var(--color-primary)" />
            ))}
          </>
        );
      }}
    </SvgChart>
  );
}
