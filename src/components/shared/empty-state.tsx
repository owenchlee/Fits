import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: IconCmp,
  title,
  description,
  action,
  className,
}: {
  icon: Icon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 rounded-tl-md rounded-tr-3xl rounded-br-md rounded-bl-3xl border border-dashed border-border/70 px-6 py-12 text-center",
        className
      )}
    >
      <span className="absolute left-4 top-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50">
        Empty
      </span>
      <IconCmp size={28} weight="duotone" className="text-primary/70" />
      <div>
        <p className="font-display text-lg font-bold">{title}</p>
        {description && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
