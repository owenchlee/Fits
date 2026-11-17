import { db } from "@/lib/db/db";
import type { SyncOutboxEntry } from "@/lib/db/db";

let flushRequested: (() => void) | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** The sync engine registers itself here so repo.ts writes can nudge a flush without importing it directly. */
export function onFlushRequested(fn: (() => void) | null) {
  flushRequested = fn;
}

export async function enqueueSync(table: SyncOutboxEntry["table"], op: SyncOutboxEntry["op"], recordId: string) {
  // Coalesce like flushOnce does (last entry per table+record+op wins) so keystroke writes don't pile up rows.
  await db.transaction("rw", db.syncOutbox, async () => {
    const stale = await db.syncOutbox
      .where("recordId")
      .equals(recordId)
      .filter((e) => e.table === table && e.op === op)
      .primaryKeys();
    if (stale.length) await db.syncOutbox.bulkDelete(stale);
    await db.syncOutbox.add({ table, recordId, op, createdAt: Date.now() });
  });
  // Trailing debounce: a burst of keystroke writes uploads once, after typing pauses.
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => flushRequested?.(), 400);
}
