"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import { LEGAL_LINKS } from "@/lib/legal";
import { cn } from "@/lib/utils";

/**
 * Shared shell for the legal/support pages. These render outside the app shell (they must be
 * reachable signed out and mid-consent, see AuthGate), so they carry their own safe-area padding
 * and a way back.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] md:px-8">
      <button
        type="button"
        onClick={goBack}
        className="-ml-1 mb-5 inline-flex h-11 items-center gap-1 pr-3 text-sm text-muted-foreground hover:text-foreground"
      >
        <CaretLeft size={16} /> Back
      </button>

      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
      {updated && <p className="mt-1.5 text-xs text-muted-foreground">Effective {updated}</p>}
      {intro && <div className="mt-5 text-[15px] leading-relaxed">{intro}</div>}

      <div className="mt-2 text-[15px] leading-relaxed">{children}</div>

      <nav aria-label="Legal" className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-5 text-xs">
        {LEGAL_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function LegalSection({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-8 scroll-mt-6">
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <div className="mt-2 space-y-3 text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ul className={cn("list-disc space-y-1.5 pl-5 marker:text-muted-foreground/60", className)}>{children}</ul>;
}

export function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http") || href.startsWith("mailto:");
  const className = "font-medium text-foreground underline underline-offset-2 hover:text-primary";
  return external ? (
    <a href={href} className={className} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
