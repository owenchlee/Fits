import { Capacitor } from "@capacitor/core";
import { exportAllData } from "@/lib/db/repo";
import { dateKey } from "@/lib/date";
import { db } from "@/lib/db/db";
import { getSettings } from "@/lib/db/repo";
import { isLoggedSet } from "@/lib/calc/load";
import { toDisplayWeight } from "@/lib/calc/units";
import type { Exercise, SetEntry, UnitSystem, Workout } from "@/lib/db/types";

export type ExportResult = "saved" | "shared" | "cancelled";

/**
 * Saves a JSON backup of everything in the local database.
 *
 * On the web that's a normal file download. Inside the native app a download link does nothing
 * (WKWebView ignores `<a download>` for blob URLs), so the file is written to the app's cache
 * and handed to the system share sheet, where the user can save it to Files, AirDrop it, etc.
 * Older native builds without the Filesystem/Share plugins fall back to the Web Share API.
 */
export async function exportBackup(): Promise<ExportResult> {
  const data = await exportAllData();
  return deliverFile(JSON.stringify(data, null, 2), `fits-export-${dateKey(new Date())}.json`, "application/json", "Fits backup");
}

/** One row per logged set of finished workouts, in the lifter's display unit. */
export async function exportSetsCsv(): Promise<ExportResult> {
  const [workouts, sets, exercises, settings] = await Promise.all([
    db.workouts.toArray(),
    db.sets.toArray(),
    db.exercises.toArray(),
    getSettings(),
  ]);
  const csv = buildSetsCsv(workouts, sets, exercises, settings.unitSystem);
  return deliverFile(csv, `fits-sets-${dateKey(new Date())}.csv`, "text/csv", "Fits training log");
}

const csvCell = (v: string | number) => {
  // Text starting with a formula trigger gets an apostrophe so spreadsheets show it as text.
  const t = typeof v === "string" && /^[=+\-@]/.test(v) ? `'${v}` : String(v);
  return /[",\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function buildSetsCsv(
  workouts: Workout[],
  sets: SetEntry[],
  exercises: Exercise[],
  unit: UnitSystem,
): string {
  const exById = new Map(exercises.map((e) => [e.id, e]));
  const setsByWorkout = new Map<string, SetEntry[]>();
  for (const s of sets) {
    const list = setsByWorkout.get(s.workoutId);
    if (list) list.push(s);
    else setsByWorkout.set(s.workoutId, [s]);
  }
  const rows: string[] = [
    ["Date", "Workout", "Exercise", "Set", "Type", `Weight (${unit})`, "Reps", "RPE"].join(","),
  ];
  const finished = workouts.filter((w) => w.completedAt != null).sort((a, b) => a.startedAt - b.startedAt);
  for (const w of finished) {
    const order = new Map(w.exerciseOrder.map((id, i) => [id, i]));
    const rank = (id: string) => order.get(id) ?? order.size;
    const list = (setsByWorkout.get(w.id) ?? []).sort(
      (a, b) => rank(a.exerciseId) - rank(b.exerciseId) || a.setIndex - b.setIndex || a.completedAt - b.completedAt,
    );
    const counts = new Map<string, number>();
    for (const s of list) {
      const ex = exById.get(s.exerciseId);
      if (!isLoggedSet(s, ex)) continue;
      let num: number | string = "";
      if (!s.isWarmup) {
        num = (counts.get(s.exerciseId) ?? 0) + 1;
        counts.set(s.exerciseId, num);
      }
      rows.push(
        [
          dateKey(new Date(w.startedAt)),
          w.title,
          ex?.name ?? "Unknown exercise",
          num,
          s.isWarmup ? "Warm-up" : "Working",
          Math.round(toDisplayWeight(s.weightKg, unit) * 100) / 100,
          s.reps,
          s.rpe ?? "",
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return rows.join("\r\n") + "\r\n";
}

async function deliverFile(json: string, fileName: string, mime: string, title: string): Promise<ExportResult> {

  if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable("Filesystem") && Capacitor.isPluginAvailable("Share")) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import("@capacitor/filesystem"),
      import("@capacitor/share"),
    ]);
    const { uri } = await Filesystem.writeFile({
      path: fileName,
      data: json,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    });
    try {
      await Share.share({ title, files: [uri] });
      return "shared";
    } catch (err) {
      if (isCancellation(err)) return "cancelled";
      throw err;
    }
  }

  const file = new File([json], fileName, { type: mime });
  if (Capacitor.isNativePlatform() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (err) {
      if (isCancellation(err)) return "cancelled";
      throw err;
    }
  }

  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking synchronously can cancel the download in some browsers before it starts.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return "saved";
}

function isCancellation(err: unknown) {
  const message = err instanceof Error ? `${err.name} ${err.message}` : String(err);
  return /abort|cancel/i.test(message);
}
