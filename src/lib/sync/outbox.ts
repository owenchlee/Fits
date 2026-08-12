import { db } from "@/lib/db/db";
import type { SyncOutboxEntry } from "@/lib/db/db";

let flushRequested: (() => void) | null = null;

/** The sync engine registers itself here so repo.ts writes can nudge a flush without importing it directly. */
export function onFlushRequested(fn: (() => void) | null) {
  flushRequested = fn;
}

export async function enqueueSync(table: SyncOutboxEntry["table"], op: SyncOutboxEntry["op"], recordId: string) {
  await db.syncOutbox.add({ table, recordId, op, createdAt: Date.now() });
  flushRequested?.();
}
