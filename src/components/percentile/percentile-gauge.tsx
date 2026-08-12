"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { StrengthTier } from "@/lib/calc/strength-standards";
import { ordinalSuffix } from "@/lib/format";

const TIER_TICKS: Array<{ pct: number; label: string }> = [
  { pct: 20, label: "Novice" },
  { pct: 50, label: "Int." },
  { pct: 80, label: "Adv." },
  { pct: 95, label: "Elite" },
];

const RADIUS = 84;
const CENTER = 100;
const ARC_LENGTH = Math.PI * RADIUS;

function pointOnArc(pct: number) {
  const angle = Math.PI - (pct / 100) * Math.PI;
  return {
    x: CENTER + RADIUS * Math.cos(angle),
    y: CENTER - RADIUS * Math.sin(angle),
  };
}

export function PercentileGauge({ percentile, tier }: { percentile: number; tier: StrengthTier }) {
  const clamped = Math.min(100, Math.max(0, percentile));
  const offset = ARC_LENGTH * (1 - clamped / 100);
  const needle = pointOnArc(clamped);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-xs">
        <path
          d={`M ${CENTER - RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${CENTER}`}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${CENTER - RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER + RADIUS} ${CENTER}`}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          initial={{ strokeDashoffset: ARC_LENGTH }}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: "spring", damping: 20, stiffness: 60 }}
        />
        {TIER_TICKS.map((t) => {
          const p = pointOnArc(t.pct);
          return (
            <circle key={t.pct} cx={p.x} cy={p.y} r={2.5} fill="var(--color-background)" stroke="var(--color-border)" strokeWidth={1} />
          );
        })}
        <motion.circle
          cx={needle.x}
          cy={needle.y}
          r={7}
          fill="var(--color-primary-foreground)"
          stroke="var(--color-primary)"
          strokeWidth={4}
          initial={false}
          animate={{ cx: needle.x, cy: needle.y }}
          transition={{ type: "spring", damping: 20, stiffness: 60 }}
        />
      </svg>
      <div className="-mt-10 flex flex-col items-center">
        <span className="font-display text-5xl font-bold tabular-nums leading-none">
          {clamped < 1 ? "<1" : Math.round(clamped)}
          <span className="text-2xl text-muted-foreground">{clamped < 1 ? "st" : ordinalSuffix(clamped)}</span>
        </span>
        <span className="mt-1 text-sm text-muted-foreground">percentile</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={tier}
            initial={{ opacity: 0, scale: 0.7, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 14, stiffness: 300 }}
            className="mt-2 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary"
          >
            {tier}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
