import type { UnitSystem } from "@/lib/db/types";

const KG_PER_LB = 0.45359237;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function toDisplayWeight(kg: number, unit: UnitSystem): number {
  return unit === "kg" ? kg : kgToLb(kg);
}

export function fromDisplayWeight(value: number, unit: UnitSystem): number {
  return unit === "kg" ? value : lbToKg(value);
}

export function formatWeight(kg: number, unit: UnitSystem, opts?: { decimals?: number }): string {
  const decimals = opts?.decimals ?? 1;
  const value = toDisplayWeight(kg, unit);
  const rounded = Math.round(value * 10 ** decimals) / 10 ** decimals;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(decimals)} ${unit}`;
}
