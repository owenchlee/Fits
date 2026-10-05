import type { Metadata } from "next";
import { LegalLink, LegalPage } from "@/components/legal/legal-page";
import { APP_NAME } from "@/lib/legal";
import licenses from "@/lib/generated/licenses.json";

export const metadata: Metadata = {
  title: "Open-source licenses — Fits",
};

export default function LicensesPage() {
  return (
    <LegalPage
      title="Open-source licenses"
      intro={
        <p className="text-muted-foreground">
          {APP_NAME} is built with the open-source software listed below. We&apos;re grateful to its authors. Each
          package is used under the license shown; tap a package to read its license text.
        </p>
      }
    >
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {licenses.packages.map((p) => (
          <li key={`${p.name}@${p.version}`}>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 truncate font-medium">
                  {p.name}
                  {p.version && <span className="ml-1.5 font-normal text-muted-foreground">{p.version}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{p.license}</span>
              </summary>
              <div className="px-4 pb-4 text-xs text-muted-foreground">
                {p.url && (
                  <p className="mb-2 break-all">
                    <LegalLink href={p.url}>{p.url}</LegalLink>
                  </p>
                )}
                {p.textId !== null ? (
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg bg-secondary/60 p-3 font-mono text-[11px] leading-relaxed">
                    {licenses.texts[p.textId]}
                  </pre>
                ) : (
                  <p>Full license text is available at the link above.</p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </LegalPage>
  );
}
