"use client";

import { useEffect, useRef } from "react";

import { formatMoney } from "@/lib/money";

/**
 * Counts from zero up to `value` once on mount (and again when the value
 * changes). It writes straight to the DOM node via a single requestAnimationFrame
 * loop instead of calling setState each frame, so many of these can run at once
 * without flooding React with re-renders or churning memory. Honours the OS
 * "reduce motion" setting by showing the final value immediately.
 */
function useCountUp(
  el: React.RefObject<HTMLElement | null>,
  value: number,
  format: (n: number) => string,
  duration = 850
) {
  // `format` is a fresh closure every render (it's created inline by callers).
  // Keeping the latest one in a ref — instead of the effect's own dependency
  // list — means an unrelated re-render doesn't restart the animation; only an
  // actual change in `value` does.
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const node = el.current;
    if (!node) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || value === 0) {
      node.textContent = formatRef.current(value);
      return;
    }

    let raf = 0;
    let start: number | null = null;

    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = formatRef.current(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else node.textContent = formatRef.current(value);
    };

    // If the tab is hidden mid-count, jump to the final figure instead of
    // leaving a frame queued for whenever the tab comes back.
    const settle = () => {
      cancelAnimationFrame(raf);
      node.textContent = formatRef.current(value);
    };
    window.addEventListener("app:suspend", settle);

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("app:suspend", settle);
    };
  }, [el, value, duration]);
}

/** A money figure that counts up from zero. */
export function CountMoney({
  value,
  currency,
  className,
}: {
  value: number;
  currency?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, (n) => formatMoney(Math.round(n), currency));
  // Server render / first paint shows the final value so there is no flash of 0.
  return (
    <span ref={ref} className={className}>
      {formatMoney(value, currency)}
    </span>
  );
}

/** A plain integer that counts up from zero. */
export function CountNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useCountUp(ref, value, (n) => Math.round(n).toLocaleString("en-IN"));
  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-IN")}
    </span>
  );
}
