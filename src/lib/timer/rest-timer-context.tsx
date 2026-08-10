"use client";

import * as React from "react";

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
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.4);
    });
    setTimeout(() => ctx.close(), 900);
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

  React.useEffect(() => {
    if (!state.isRunning) return;
    const id = setInterval(() => {
      setState((s) => {
        if (!s.isRunning) return s;
        const next = s.secondsLeft - 1;
        if (next <= 0) {
          if (!hasFiredRef.current) {
            hasFiredRef.current = true;
            playChime();
          }
          return { ...s, secondsLeft: 0, isRunning: false };
        }
        return { ...s, secondsLeft: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [state.isRunning]);

  const start = React.useCallback((seconds: number, label?: string) => {
    hasFiredRef.current = false;
    setState({ label: label ?? null, totalSeconds: seconds, secondsLeft: seconds, isRunning: true });
  }, []);

  const pause = React.useCallback(() => setState((s) => ({ ...s, isRunning: false })), []);
  const resume = React.useCallback(
    () => setState((s) => (s.secondsLeft > 0 ? { ...s, isRunning: true } : s)),
    []
  );
  const addTime = React.useCallback(
    (delta: number) =>
      setState((s) => {
        if (s.totalSeconds === 0) return s;
        hasFiredRef.current = false;
        const secondsLeft = Math.max(0, s.secondsLeft + delta);
        return { ...s, secondsLeft, totalSeconds: Math.max(s.totalSeconds, secondsLeft), isRunning: secondsLeft > 0 };
      }),
    []
  );
  const stop = React.useCallback(
    () => setState({ label: null, totalSeconds: 0, secondsLeft: 0, isRunning: false }),
    []
  );

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
