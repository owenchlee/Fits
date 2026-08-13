"use client";

import * as React from "react";

/** True while an on-screen keyboard is covering part of the viewport (mobile web/native input focus). */
export function useKeyboardVisible(threshold = 150) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function update() {
      setVisible(window.innerHeight - vv!.height > threshold);
    }

    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, [threshold]);

  return visible;
}
