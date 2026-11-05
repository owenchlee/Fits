"use client";

import { Barbell } from "@phosphor-icons/react/dist/ssr";
import { EmptyState } from "@/components/shared/empty-state";
import { SvgChart, TooltipBox, niceTicks } from "./svg-chart";

export interface VolumePoint {
  label: string;
  value: number;
}

export function VolumeBarChart({ data, unitLabel, height = 200 }: { data: VolumePoint[]; unitLabel: string; height?: number }) {
  if (data.every((d) => d.value === 0)) {
    return <EmptyState icon={Barbell} title="No volume logged yet" className="py-8" />;
  }

  const ticks = niceTicks(0, Math.max(...data.map((d) => d.value)));
  const yMax = ticks[ticks.length - 1];
  const xs = (i: number, w: number) => ((i + 0.5) / data.length) * w;

  return (
    <SvgChart
      height={height}
      label={`Bar chart of training volume across ${data.length} weeks`}
      labels={data.map((d) => d.label)}
      ticks={ticks}
      yMin={0}
      yMax={yMax}
      xs={xs}
      tooltip={(i) => <TooltipBox title={data[i].label} value={`${data[i].value.toLocaleString()} ${unitLabel}`} />}
    >
      {({ y, plotW, active }) => {
        const slot = plotW / data.length;
        const bw = Math.min(28, slot * 0.8);
        return (
          <>
            {active !== null && (
              <rect x={active * slot} y={y(yMax)} width={slot} height={y(0) - y(yMax)} fill="var(--color-secondary)" />
            )}
            {data.map((d, i) => {
              const h = y(0) - y(d.value);
              return (
                <rect key={i} x={xs(i, plotW) - bw / 2} y={y(d.value)} width={bw} height={h} rx={Math.min(4, h / 2)} fill="var(--color-primary)" />
              );
            })}
          </>
        );
      }}
    </SvgChart>
  );
}
