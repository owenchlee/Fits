"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DotsThreeCircle, Plus } from "@phosphor-icons/react/dist/ssr";
import { primaryNavItems, secondaryNavItems } from "@/lib/nav";
import { useKeyboardVisible } from "@/lib/hooks/use-keyboard-visible";
import { useActiveWorkout } from "@/lib/db/hooks";
import { startWorkout } from "@/lib/db/repo";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";

function StartWorkoutButton() {
  const router = useRouter();
  const activeWorkout = useActiveWorkout();

  async function handleClick() {
    if (activeWorkout) {
      router.push(`/train?workoutId=${activeWorkout.id}`);
      return;
    }
    const id = await startWorkout({ title: "Quick Workout" });
    router.push(`/train?workoutId=${id}`);
  }

  return (
    <li className="flex items-center justify-center">
      <button
        onClick={handleClick}
        aria-label="Start empty workout"
        className="flex size-11 -translate-y-2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
      >
        <Plus size={22} weight="bold" />
      </button>
    </li>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const moreActive = secondaryNavItems.some((item) => pathname.startsWith(item.href));
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
      <ul className="glass mx-auto grid max-w-sm grid-cols-5 rounded-full border border-border/60 bg-card px-1.5 py-1.5 shadow-lg shadow-black/10">
        {primaryNavItems.slice(0, 2).map(renderNavItem)}
        <StartWorkoutButton />
        {primaryNavItems.slice(2).map(renderNavItem)}
        <li>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex w-full flex-col items-center gap-0.5 rounded-full py-1.5 text-[10px] font-medium">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full transition-colors",
                    moreActive ? "bg-primary/15 text-primary" : "text-muted-foreground"
                  )}
                >
                  <DotsThreeCircle size={20} weight={moreActive ? "fill" : "regular"} />
                </span>
                <span className={moreActive ? "text-primary" : "text-muted-foreground"}>More</span>
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
