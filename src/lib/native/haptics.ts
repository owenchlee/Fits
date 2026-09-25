import { Capacitor } from "@capacitor/core";

// No-ops on web/PWA — @capacitor/haptics is only imported when actually running
// inside the native shell, matching the lazy-import pattern in capacitor-init.tsx.
export async function hapticLightTap() {
  if (!Capacitor.isNativePlatform()) return;
  const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
  await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export async function hapticSuccess() {
  if (!Capacitor.isNativePlatform()) return;
  const { Haptics, NotificationType } = await import("@capacitor/haptics");
  await Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}
