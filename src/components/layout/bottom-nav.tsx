"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DotsThreeCircle } from "@phosphor-icons/react/dist/ssr";
import { primaryNavItems, secondaryNavItems } from "@/lib/nav";
import { useKeyboardVisible } from "@/lib/hooks/use-keyboard-visible";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const moreActive = secondaryNavItems.some((item) => pathname.startsWith(item.href));
  const keyboardVisible = useKeyboardVisible();

  return (
    <nav
      className={cn(
        "glass fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden",
        keyboardVisible && "hidden"
      )}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-6">
        {primaryNavItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon size={22} weight={active ? "fill" : "regular"} />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium",
                  moreActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <DotsThreeCircle size={22} weight={moreActive ? "fill" : "regular"} />
                More
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <SheetHeader>
                <SheetTitle>More</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 px-4 pb-2">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex flex-col items-center gap-2 rounded-xl border border-border bg-secondary/40 px-2 py-4 text-center text-xs font-medium hover:bg-secondary"
                    >
                      <Icon size={22} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <span className="text-sm text-muted-foreground">Appearance</span>
                <ThemeToggle />
              </div>
            </SheetContent>
          </Sheet>
        </li>
      </ul>
    </nav>
  );
}
