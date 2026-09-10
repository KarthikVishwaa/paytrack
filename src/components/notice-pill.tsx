"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const SWIPE_RIGHT_PX = 70;
const SWIPE_UP_PX = 50;

/**
 * The floating pill shared by the reminder and subscription notices —
 * rounded, theme-native, with a small pulsing "live" dot (pure CSS, no JS
 * timer). Swipe right or swipe up to dismiss, same as a phone notification;
 * anything else snaps back. Pointer Events cover touch, mouse and pen in
 * one code path, and `touch-action: none` stops the browser's own scroll
 * gesture from fighting the drag while a finger is on the pill.
 */
export default function NoticePill({
  icon: Icon,
  dotColor,
  onDismiss,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  dotColor: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [leaving, setLeaving] = useState<"right" | "up" | null>(null);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  // Mirrors `drag` synchronously, read by endDrag() — a pointerup fired in
  // the same tick as the pointermoves before it (a fast flick, or a script
  // driving the gesture) could otherwise see a stale `drag` from whatever
  // render happened to have produced the currently-attached closure.
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  function close(direction: "right" | "up") {
    if (leaving) return;
    setLeaving(direction);
    window.setTimeout(onDismiss, 180);
  }

  function onPointerDown(e: React.PointerEvent) {
    if (leaving) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || e.pointerId !== start.current.id) return;
    const next = { x: e.clientX - start.current.x, y: e.clientY - start.current.y };
    dragRef.current = next;
    setDrag(next);
  }

  function endDrag() {
    start.current = null;
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.x > SWIPE_RIGHT_PX) close("right");
    else if (d.y < -SWIPE_UP_PX) close("up");
    else setDrag(null);
  }

  // How close the current drag is to a dismiss threshold, 0-1 — used to fade
  // the pill out as it's swiped, so letting go partway still looks intentional.
  const progress = drag
    ? Math.min(1, Math.max(drag.x / SWIPE_RIGHT_PX, -drag.y / SWIPE_UP_PX, 0))
    : 0;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="status"
      className="pointer-events-auto animate-rise bg-foreground text-background flex max-w-[min(22rem,calc(100vw-2rem))] cursor-grab items-center gap-3 rounded-3xl py-2.5 pr-3 pl-2.5 shadow-xl shadow-black/20 select-none active:cursor-grabbing"
      style={{
        touchAction: "none",
        transform:
          leaving === "right"
            ? "translate3d(140%, -8%, 0)"
            : leaving === "up"
              ? "translate3d(0, -140%, 0)"
              : drag
                ? `translate3d(${drag.x}px, ${drag.y}px, 0)`
                : undefined,
        opacity: leaving ? 0 : 1 - progress * 0.7,
        transition: drag && !leaving ? "none" : "transform 200ms ease, opacity 200ms ease",
      }}
    >
      <span className="bg-background/15 relative grid size-8 shrink-0 place-items-center rounded-full">
        <Icon className="size-4" />
        <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              dotColor
            )}
          />
          <span className={cn("relative inline-flex size-2.5 rounded-full", dotColor)} />
        </span>
      </span>

      <span className="min-w-0 text-[13px] leading-snug font-medium">{children}</span>

      <button
        onClick={() => close("right")}
        aria-label="Dismiss"
        className="hover:bg-background/10 shrink-0 self-start rounded-full p-1.5 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
