"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/** No-ops entirely on web — only wires up native chrome/back-button behavior inside the app shell. */
export function CapacitorInit() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeBackButtonListener: (() => void) | undefined;

    void (async () => {
      const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/status-bar"),
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);

      await StatusBar.setStyle({ style: Style.Dark });
      await SplashScreen.hide();

      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.exitApp();
      });
      removeBackButtonListener = () => void handle.remove();
    })();

    return () => removeBackButtonListener?.();
  }, []);

  return null;
}
