"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin bar that creeps across the top the moment a tab is tapped and snaps to
 * full when the new page settles — so navigation always feels like it responded,
 * even while the next route is still loading.
 *
 * The creep timer is stopped whenever the tab is hidden or the bar finishes, so
 * a backgrounded or stalled navigation never leaves a timer running.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const creep = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopCreep = useCallback(() => {
    if (creep.current) {
      clearInterval(creep.current);
      creep.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    stopCreep();
    if (done.current) clearTimeout(done.current);
    setVisible(false);
    setWidth(0);
  }, [stopCreep]);

  useEffect(() => {
    const start = () => {
      if (document.visibilityState !== "visible") return;
      if (done.current) clearTimeout(done.current);
      setVisible(true);
      setWidth(12);
      stopCreep();
      creep.current = setInterval(() => {
        setWidth((w) => (w < 88 ? w + (90 - w) * 0.12 : w));
      }, 180);
      // Safety net: never let the timer outlive a navigation that stalls.
      done.current = setTimeout(finish, 10000);
    };

    window.addEventListener("nav:start", start);
    // The tab went away — drop the timer rather than tick in the background.
    window.addEventListener("app:suspend", finish);

    return () => {
      window.removeEventListener("nav:start", start);
      window.removeEventListener("app:suspend", finish);
      stopCreep();
      if (done.current) clearTimeout(done.current);
    };
  }, [finish, stopCreep]);

  // The route settled — fill and fade out.
  useEffect(() => {
    if (!visible) return;
    stopCreep();
    setWidth(100);
    if (done.current) clearTimeout(done.current);
    done.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 280);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5"
      style={{ transition: "opacity 200ms ease" }}
    >
      <div
        className="bg-primary h-full rounded-r-full"
        style={{
          width: `${width}%`,
          transition: "width 200ms ease",
          boxShadow: "0 0 10px var(--primary)",
        }}
      />
    </div>
  );
}
