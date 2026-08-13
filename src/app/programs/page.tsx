"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowCounterClockwise, CheckCircle, ClipboardText } from "@phosphor-icons/react/dist/ssr";
import { usePrograms, useSettings } from "@/lib/db/hooks";
import { restoreProgram } from "@/lib/db/repo";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProgramBuilderDialog } from "@/components/programs/program-builder-dialog";
import { Button } from "@/components/ui/button";

export default function ProgramsPage() {
  const allPrograms = usePrograms();
  const settings = useSettings();
  const [showRemoved, setShowRemoved] = React.useState(false);

  const hiddenIds = settings.hiddenProgramIds ?? [];
  const programs = allPrograms.filter((p) => !hiddenIds.includes(p.id));
  const removedPrograms = allPrograms.filter((p) => hiddenIds.includes(p.id));

  return (
    <div className="pb-6">
      <PageHeader
        title="Programs"
        description="Follow a proven plan or build your own. Set one active and it drives your dashboard's daily session."
        action={<ProgramBuilderDialog />}
      />

      {programs.length === 0 ? (
        <EmptyState
          icon={ClipboardText}
          title="No programs yet"
          description="Build one above and it'll drive your dashboard's daily session."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {programs.map((program) => {
            const isActive = settings.activeProgramId === program.id;
            return (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-display text-xl font-bold group-hover:text-primary">{program.name}</h2>
                  {isActive && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <CheckCircle size={12} weight="fill" /> Active
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{program.description}</p>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{program.days.length} day split</span>
                  <span>·</span>
                  <span>{program.author}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {removedPrograms.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowRemoved((v) => !v)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {showRemoved ? "Hide" : "Show"} removed programs ({removedPrograms.length})
          </button>
          {showRemoved && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {removedPrograms.map((program) => (
                <div
                  key={program.id}
                  className="flex flex-col rounded-2xl border border-dashed border-border p-4 opacity-70"
                >
                  <h2 className="font-display text-xl font-bold">{program.name}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{program.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 self-start"
                    onClick={() => restoreProgram(program.id)}
                  >
                    <ArrowCounterClockwise size={14} /> Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
