"use client";

import * as React from "react";
import { Capacitor } from "@capacitor/core";

type RestTimerState = {
  label: string | null;
  totalSeconds: number;
  secondsLeft: number;
  isRunning: boolean;
};

type RestTimerContextValue = RestTimerState & {
  start: (seconds: number, label?: string) => void;
  pause: () => void;
  resume: () => void;
  addTime: (deltaSeconds: number) => void;
  stop: () => void;
};

const RestTimerContext = React.createContext<RestTimerContextValue | null>(null);

function playChime() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1320, 880, 1320].forEach((freq, i) => {
      const start = i * 0.35;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + 0.55);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + 0.6);
    });
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // audio not available; ignore
  }
  if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<RestTimerState>({
    label: null,
    totalSeconds: 0,
    secondsLeft: 0,
    isRunning: false,
  });
  const hasFiredRef = React.useRef(false);
  // Wall-clock deadline rather than a per-tick decrement, so the countdown stays correct even
  // when `setInterval` is throttled or fully suspended while the tab/app is backgrounded —
  // a foreground tick or resume event just recomputes from this instead of losing time.
  const endAtRef = React.useRef<number | null>(null);

  const tick = React.useCallback(() => {
    setState((s) => {
      if (!s.isRunning || endAtRef.current === null) return s;
      const remaining = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      if (remaining <= 0) {
        if (!hasFiredRef.current) {
          hasFiredRef.current = true;
          playChime();
        }
        endAtRef.current = null;
        return { ...s, secondsLeft: 0, isRunning: false };
      }
      if (remaining === s.secondsLeft) return s;
      return { ...s, secondsLeft: remaining };
    });
  }, []);

  React.useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.isRunning, tick]);

  React.useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") tick();
    }
    document.addEventListener("visibilitychange", onVisible);

    let removeListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void (async () => {
        const { App } = await import("@capacitor/app");
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) tick();
        });
        removeListener = () => void handle.remove();
      })();
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      removeListener?.();
    };
  }, [tick]);

  const start = React.useCallback((seconds: number, label?: string) => {
    hasFiredRef.current = false;
    endAtRef.current = Date.now() + seconds * 1000;
    setState({ label: label ?? null, totalSeconds: seconds, secondsLeft: seconds, isRunning: true });
  }, []);

  const pause = React.useCallback(() => {
    setState((s) => {
      if (!s.isRunning) return s;
      const remaining =
        endAtRef.current !== null ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000)) : s.secondsLeft;
      endAtRef.current = null;
      return { ...s, secondsLeft: remaining, isRunning: false };
    });
  }, []);

  const resume = React.useCallback(() => {
    setState((s) => {
      if (s.secondsLeft <= 0) return s;
      endAtRef.current = Date.now() + s.secondsLeft * 1000;
      return { ...s, isRunning: true };
    });
  }, []);

  const addTime = React.useCallback((delta: number) => {
    setState((s) => {
      if (s.totalSeconds === 0) return s;
      hasFiredRef.current = false;
      const baseRemaining =
        s.isRunning && endAtRef.current !== null
          ? Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000))
          : s.secondsLeft;
      const secondsLeft = Math.max(0, baseRemaining + delta);
      const isRunning = secondsLeft > 0;
      endAtRef.current = isRunning ? Date.now() + secondsLeft * 1000 : null;
      return { ...s, secondsLeft, totalSeconds: Math.max(s.totalSeconds, secondsLeft), isRunning };
    });
  }, []);

  const stop = React.useCallback(() => {
    endAtRef.current = null;
    setState({ label: null, totalSeconds: 0, secondsLeft: 0, isRunning: false });
  }, []);

  const value = React.useMemo(
    () => ({ ...state, start, pause, resume, addTime, stop }),
    [state, start, pause, resume, addTime, stop]
  );

  return <RestTimerContext.Provider value={value}>{children}</RestTimerContext.Provider>;
}

export function useRestTimer() {
  const ctx = React.useContext(RestTimerContext);
  if (!ctx) throw new Error("useRestTimer must be used within RestTimerProvider");
  return ctx;
}
