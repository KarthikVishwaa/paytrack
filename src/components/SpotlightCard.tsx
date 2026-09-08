"use client";

import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * A card with a soft light that follows the pointer.
 * Adapted from React Bits (reactbits.dev) to use this app's theme tokens, so it looks right
 * in both the light and the true-black themes. On touch screens there is no pointer to
 * follow, so the light simply never appears and the card behaves like a normal one.
 */
export default function SpotlightCard({
  children,
  className = "",
  spotlightColor = "var(--spotlight)",
  ...props
}: React.ComponentProps<"div"> & { spotlightColor?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = divRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onFocus={() => setOpacity(1)}
      onBlur={() => setOpacity(0)}
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground relative overflow-hidden rounded-xl border py-4 shadow-sm",
        "transition-[box-shadow,transform,border-color] duration-300 hover:border-primary/25 hover:shadow-md",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background:
            "radial-gradient(340px circle at " +
            position.x +
            "px " +
            position.y +
            "px, " +
            spotlightColor +
            ", transparent 70%)",
        }}
      />
      <div className="relative flex flex-col gap-4">{children}</div>
    </div>
  );
}
