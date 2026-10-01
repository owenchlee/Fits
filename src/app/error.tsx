"use client";

import * as React from "react";
import { ArrowClockwise, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { ensureDbConnection } from "@/lib/db/db";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  // Most crashes here are a dead IndexedDB connection after backgrounding; retrying without
  // reopening it just throws again.
  async function handleRetry() {
    try {
      await ensureDbConnection();
      retry();
    } catch {
      window.location.reload();
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <WarningCircle size={40} weight="duotone" className="text-primary/70" />
      <div>
        <p className="font-display text-lg font-bold">This page couldn&apos;t load</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Something went wrong. Your workout data is stored locally and hasn&apos;t been lost.
        </p>
      </div>
      <Button onClick={() => void handleRetry()}>
        <ArrowClockwise size={15} /> Try again
      </Button>
    </div>
  );
}
