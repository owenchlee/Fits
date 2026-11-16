import { Capacitor } from "@capacitor/core";
import { exportAllData } from "@/lib/db/repo";
import { dateKey } from "@/lib/date";

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
  const json = JSON.stringify(data, null, 2);
  const fileName = `fits-export-${dateKey(new Date())}.json`;

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
      await Share.share({ title: "Fits backup", files: [uri] });
      return "shared";
    } catch (err) {
      if (isCancellation(err)) return "cancelled";
      throw err;
    }
  }

  const file = new File([json], fileName, { type: "application/json" });
  if (Capacitor.isNativePlatform() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Fits backup" });
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
