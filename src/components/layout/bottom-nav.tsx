"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavItems } from "@/lib/nav";
import { useKeyboardVisible } from "@/lib/hooks/use-keyboard-visible";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const keyboardVisible = useKeyboardVisible();

  function renderNavItem(item: (typeof primaryNavItems)[number]) {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className="flex flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium"
        >
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors",
              active ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}
          >
            <Icon size={20} weight={active ? "fill" : "regular"} />
          </span>
          <span className={active ? "text-primary" : "text-muted-foreground"}>{item.label}</span>
        </Link>
      </li>
    );
  }

  return (
    <nav
      className={cn(
        "fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 md:hidden",
        keyboardVisible && "hidden"
      )}
      aria-label="Primary"
    >
      <ul className="glass mx-auto grid max-w-sm grid-cols-4 rounded-full border border-border/60 bg-card px-1.5 py-1.5 shadow-lg shadow-black/10">
        {primaryNavItems.map(renderNavItem)}
      </ul>
    </nav>
  );
}
