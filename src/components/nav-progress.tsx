"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin bar that creeps across the top the moment a tab is tapped and snaps to
 * full when the new page settles — so navigation always feels like it responded,
 * even while the next route is still loading.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const creep = useRef<ReturnType<typeof setInterval> | null>(null);
  const done = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = () => {
      if (done.current) clearTimeout(done.current);
      setVisible(true);
      setWidth(12);
      if (creep.current) clearInterval(creep.current);
      creep.current = setInterval(() => {
        setWidth((w) => (w < 88 ? w + (90 - w) * 0.12 : w));
      }, 180);
    };
    window.addEventListener("nav:start", start);
    return () => {
      window.removeEventListener("nav:start", start);
      if (creep.current) clearInterval(creep.current);
    };
  }, []);

  // The route settled — fill and fade out.
  useEffect(() => {
    if (!visible) return;
    if (creep.current) clearInterval(creep.current);
    setWidth(100);
    done.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 280);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
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
