import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  unit,
  icon: IconCmp,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  icon?: Icon;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4",
        accent && "border-primary/30 bg-gradient-to-br from-primary/10 to-transparent",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {IconCmp && (
          <IconCmp size={16} className={cn("text-muted-foreground", accent && "text-primary")} />
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tabular-nums leading-none md:text-3xl">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
