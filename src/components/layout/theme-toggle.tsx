"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label="Toggle color theme"
      suppressHydrationWarning
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-muted",
        className
      )}
    >
      <Sun size={16} className="hidden dark:inline-block" />
      <Moon size={16} className="inline-block dark:hidden" />
    </button>
  );
}
