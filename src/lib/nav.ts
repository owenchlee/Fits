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
  /** Shown directly in the mobile bottom bar. */
  primary?: boolean;
};

export const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: House, primary: true },
  { href: "/programs", label: "Programs", icon: ClipboardText, primary: true },
  { href: "/statistics", label: "Statistics", icon: ChartLineUp, primary: true },
  { href: "/profile", label: "Profile", icon: UserCircle, primary: true },
  { href: "/calendar", label: "Calendar", icon: CalendarBlank },
  { href: "/exercises", label: "Exercises", icon: BookOpenText },
];

export const primaryNavItems = navItems.filter((item) => item.primary);
