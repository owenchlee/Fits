"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { ensureSeeded } from "@/lib/db/bootstrap";
import { ensureDbConnection } from "@/lib/db/db";

export function DbInit() {
  useEffect(() => {
    void ensureSeeded();
  }, []);

  // Revive the IndexedDB connection whenever the app returns to the foreground, before any
  // live query re-runs against a connection the OS killed while we were in the background.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") void ensureDbConnection().catch(() => {});
    }
    document.addEventListener("visibilitychange", onVisible);

    let removeListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void ensureDbConnection().catch(() => {});
        });
        removeListener = () => void handle.remove();
      })();
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      removeListener?.();
    };
  }, []);

  return null;
}
