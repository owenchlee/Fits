"use client";

import * as React from "react";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
        <div>
          <p className="font-display text-lg font-bold">This page couldn&apos;t load</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Something went wrong. Your workout data is stored locally and hasn&apos;t been lost.
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
