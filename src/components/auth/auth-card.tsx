import Link from "next/link";
import { Barbell } from "@phosphor-icons/react/dist/ssr";

export function AuthCard({
  title,
  description,
  children,
  footer,
  secondaryAction,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Rendered under the card, e.g. "Continue without an account". */
  secondaryAction?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center justify-center gap-2">
        <Barbell size={22} weight="fill" className="text-primary" />
        <span className="font-display text-2xl font-bold tracking-tight">Fits</span>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        <div className="mt-5 space-y-4">{children}</div>
      </div>
      {footer && <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>}
      {secondaryAction && <div className="mt-4">{secondaryAction}</div>}
      <p className="mt-6 flex justify-center gap-4 text-xs text-muted-foreground">
        <Link href="/terms" className="hover:underline">
          Terms
        </Link>
        <Link href="/privacy" className="hover:underline">
          Privacy
        </Link>
        <Link href="/support" className="hover:underline">
          Support
        </Link>
      </p>
    </div>
  );
}
