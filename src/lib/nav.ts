import type { Icon } from "@phosphor-icons/react";
import {
  Barbell,
  ChartLineUp,
  ClipboardText,
  ClockCounterClockwise,
  GearSix,
  House,
  Ruler,
  Trophy,
} from "@phosphor-icons/react/dist/ssr";
import { BookOpenText } from "@phosphor-icons/react/dist/ssr";

export type NavItem = {
  href: string;
  label: string;
  icon: Icon;
  /** Shown in the mobile bottom bar (max 5 across the whole app). */
  primary?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: House, primary: true },
  { href: "/train", label: "Train", icon: Barbell, primary: true },
  { href: "/programs", label: "Programs", icon: ClipboardText, primary: true },
  { href: "/progress", label: "Progress", icon: ChartLineUp, primary: true },
  { href: "/exercises", label: "Exercises", icon: BookOpenText },
  { href: "/percentile", label: "Percentile", icon: Trophy },
  { href: "/history", label: "History", icon: ClockCounterClockwise },
  { href: "/measurements", label: "Measurements", icon: Ruler },
  { href: "/settings", label: "Settings", icon: GearSix },
];

export const secondaryNavItems = navItems.filter((item) => !item.primary);
export const primaryNavItems = navItems.filter((item) => item.primary);
