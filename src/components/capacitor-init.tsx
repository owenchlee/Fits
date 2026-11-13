"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useTheme } from "next-themes";

const OPEN_OVERLAY =
  '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"], [role="listbox"][data-state="open"]';

/** No-ops entirely on web — only wires up native chrome/back-button behavior inside the app shell. */
export function CapacitorInit() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !resolvedTheme) return;
    let stale = false;
    void (async () => {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      if (stale) return;
      await StatusBar.setStyle({ style: resolvedTheme === "light" ? Style.Light : Style.Dark });
    })();
    return () => {
      stale = true;
    };
  }, [resolvedTheme]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeBackButtonListener: (() => void) | undefined;

    void (async () => {
      const [{ SplashScreen }, { App }] = await Promise.all([
        import("@capacitor/splash-screen"),
        import("@capacitor/app"),
      ]);

      await SplashScreen.hide();

      const handle = await App.addListener("backButton", ({ canGoBack }) => {
        // Close an open Radix overlay (dialog, sheet, popover, menu) instead of navigating.
        if (document.querySelector(OPEN_OVERLAY)) {
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        } else if (canGoBack) window.history.back();
        else void App.exitApp();
      });
      removeBackButtonListener = () => void handle.remove();
    })();

    return () => removeBackButtonListener?.();
  }, []);

  return null;
}
