"use client";

import { useEffect } from "react";

// Browsers do not scroll a focused control that is already (partly) on screen, even if the fixed
// bottom chrome covers it. Nudge it above the floating nav/bars.
export function FocusGuard() {
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      requestAnimationFrame(() => {
        const tops = [...document.querySelectorAll("nav.fixed.inset-x-4, div.fixed.inset-x-4")]
          .filter((c) => c.getClientRects().length && !c.contains(el))
          .map((c) => c.getBoundingClientRect().top);
        if (!tops.length) return;
        const overlap = el.getBoundingClientRect().bottom - (Math.min(...tops) - 8);
        if (overlap > 0) document.body.scrollBy({ top: overlap, behavior: "instant" });
      });
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);
  return null;
}
