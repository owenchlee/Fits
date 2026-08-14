import type { Icon } from "@phosphor-icons/react";
import {
  Barbell,
  CalendarBlank,
  ChartLineUp,
  ClipboardText,
  House,
  UserCircle,
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
  { href: "/statistics", label: "Statistics", icon: ChartLineUp, primary: true },
  { href: "/calendar", label: "Calendar", icon: CalendarBlank },
  { href: "/exercises", label: "Exercises", icon: BookOpenText },
  { href: "/profile", label: "Profile", icon: UserCircle, primary: true },
];

export const secondaryNavItems = navItems.filter((item) => !item.primary);
export const primaryNavItems = navItems.filter((item) => item.primary);
