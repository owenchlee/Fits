import type { Icon } from "@phosphor-icons/react";
import {
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
  /** Shown directly in the mobile bottom bar, flanking the start-workout FAB. Keep to 3 so nav + FAB + "+ More" stays at 5 tabs total. */
  primary?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: House, primary: true },
  { href: "/statistics", label: "Statistics", icon: ChartLineUp, primary: true },
  { href: "/profile", label: "Profile", icon: UserCircle, primary: true },
  { href: "/programs", label: "Programs", icon: ClipboardText },
  { href: "/calendar", label: "Calendar", icon: CalendarBlank },
  { href: "/exercises", label: "Exercises", icon: BookOpenText },
];

export const secondaryNavItems = navItems.filter((item) => !item.primary);
export const primaryNavItems = navItems.filter((item) => item.primary);
