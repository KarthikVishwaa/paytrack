"use client";

import { useEffect, useRef, useState } from "react";

import { formatMoney } from "@/lib/money";

/**
 * Counts from 0 up to `target` once on mount (and again whenever the target
 * changes), with an ease-out so it decelerates into the final figure. Honours
 * the OS "reduce motion" setting by jumping straight to the value.
 */
function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(target === 0 ? 0 : 0);
  const frame = useRef(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === 0) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    const from = 0;

    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(tick);
      else setValue(target);
    };

    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
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
  const n = useCountUp(value);
  // Round to whole rupees while animating so it doesn't flash long decimals.
  const shown = Math.abs(n - value) < 0.5 ? value : Math.round(n);
  return <span className={className}>{formatMoney(shown, currency)}</span>;
}

/** A plain integer that counts up from zero. */
export function CountNumber({ value, className }: { value: number; className?: string }) {
  const n = useCountUp(value);
  return <span className={className}>{Math.round(n).toLocaleString("en-IN")}</span>;
}
