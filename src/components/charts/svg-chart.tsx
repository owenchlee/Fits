"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export const PAD = { top: 8, right: 8, bottom: 22, left: 40 };
const TICK = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const raw = (max - min) / (count - 1);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; v < max + step; v += step) {
    ticks.push(Math.round(v / step) * step);
    if (v >= max) break;
  }
  return ticks;
}

/** Monotone cubic path through points (Fritsch-Carlson), like recharts "monotone". */
export function monotonePath(pts: Array<[number, number]>): string {
  const n = pts.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1][0] - pts[i][0]);
    m.push((pts[i + 1][1] - pts[i][1]) / dx[i]);
  }
  const t = [m[0]];
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  t.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${pts[i][0] + h},${pts[i][1] + t[i] * h},${pts[i + 1][0] - h},${pts[i + 1][1] - t[i + 1] * h},${pts[i + 1][0]},${pts[i + 1][1]}`;
  }
  return d;
}

export function SvgChart({
  height,
  label,
  labels,
  ticks,
  yMin,
  yMax,
  xs,
  tooltip,
  children,
}: {
  height: number;
  label: string;
  labels: string[];
  ticks: number[];
  yMin: number;
  yMax: number;
  /** x position builder given plot width */
  xs: (i: number, plotW: number) => number;
  tooltip: (i: number) => ReactNode;
  children: (g: { y: (v: number) => number; plotW: number; plotH: number; active: number | null }) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const pinned = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
  const step = Math.max(1, Math.ceil(56 / Math.max(1, plotW / Math.max(1, labels.length))));

  function nearest(e: React.PointerEvent | React.MouseEvent) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left - PAD.left;
    let best = 0;
    for (let i = 1; i < labels.length; i++) {
      if (Math.abs(xs(i, plotW) - x) < Math.abs(xs(best, plotW) - x)) best = i;
    }
    return best;
  }

  // A tap pins the tooltip (touch has no hover); mouse hover stays transient.
  function onTap(e: React.PointerEvent | React.MouseEvent) {
    if ("pointerType" in e && e.pointerType === "mouse") return;
    pinned.current = true;
    setActive(nearest(e));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const n = labels.length;
    const next =
      e.key === "ArrowRight" ? Math.min(n - 1, (active ?? -1) + 1)
      : e.key === "ArrowLeft" ? Math.max(0, (active ?? n) - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
  }

  return (
    <div
      ref={ref}
      style={{ width: "100%", height, position: "relative" }}
      className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="img"
      aria-label={label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      onPointerDown={onTap}
      onClick={onTap}
      onPointerMove={(e) => {
        if (!pinned.current || e.pointerType === "mouse") setActive(nearest(e));
      }}
      onPointerLeave={() => {
        if (!pinned.current) setActive(null);
      }}
    >
      {width > 0 && (
        <svg width={width} height={height} style={{ display: "block" }}>
          {ticks.map((v) => (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="var(--color-border)"
                strokeDasharray="3 3"
              />
              <text x={PAD.left - 6} y={y(v)} textAnchor="end" dominantBaseline="middle" {...TICK}>
                {v.toLocaleString()}
              </text>
            </g>
          ))}
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={PAD.top + plotH}
            y2={PAD.top + plotH}
            stroke="var(--color-border)"
          />
          {labels.map((l, i) =>
            i % step === 0 ? (
              <text key={i} x={PAD.left + xs(i, plotW)} y={height - 6} textAnchor="middle" {...TICK}>
                {l}
              </text>
            ) : null,
          )}
          <g transform={`translate(${PAD.left},0)`}>{children({ y, plotW, plotH, active })}</g>
        </svg>
      )}
      {active !== null && width > 0 && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2"
          style={{ left: Math.min(Math.max(60, PAD.left + xs(active, plotW)), width - 60) }}
        >
          {tooltip(active)}
        </div>
      )}
    </div>
  );
}

export function TooltipBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{title}</p>
      <p className="tabular-nums text-muted-foreground">{value}</p>
    </div>
  );
}
