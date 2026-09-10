"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

import { useSubscriptions } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { daysUntil } from "@/lib/types";

/** How far ahead a renewal starts showing up as a reminder. */
export const WINDOW_DAYS = 30;

/**
 * A floating pill for the soonest subscription renewal — like a turn-by-turn
 * nav card, it sits on top of the page and never pushes content around, and
 * stays in place while the page scrolls underneath. The little "live" dot is
 * a plain CSS animation (Tailwind's animate-ping), not a JS interval, so it
 * costs nothing on battery no matter how long it sits on screen.
 *
 * Dismissing it only hides today's reminder — it comes back tomorrow, a
 * little more urgent, until the admin pushes the date out or it's handled.
 */
export default function SubscriptionBanner() {
  const { data } = useSubscriptions();
  const [dismissed, setDismissed] = useState(true);

  const upcoming = (data?.subscriptions ?? [])
    .map((s) => ({ ...s, days: daysUntil(s.dueDate) }))
    .filter((s) => s.days <= WINDOW_DAYS)
    .sort((a, b) => a.days - b.days)[0];

  const today = new Date().toISOString().slice(0, 10);
  const storageKey = upcoming ? `paytrack-sub-${upcoming._id}-${upcoming.dueDate}-${today}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      setDismissed(Boolean(localStorage.getItem(storageKey)));
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  if (!upcoming || !storageKey || dismissed) return null;

  function dismiss() {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // private mode — just hide it for this render
    }
    setDismissed(true);
  }

  const urgent = upcoming.days <= 3;
  const dot = urgent ? "bg-destructive" : "bg-warning";
  const label =
    upcoming.days < 0
      ? `${upcoming.title} is ${Math.abs(upcoming.days)} day${Math.abs(upcoming.days) === 1 ? "" : "s"} overdue`
      : upcoming.days === 0
        ? `${upcoming.title} renews today`
        : `${upcoming.title} renews in ${upcoming.days} day${upcoming.days === 1 ? "" : "s"}`;

  return (
    <div
      className="pointer-events-auto animate-rise bg-foreground text-background flex max-w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-3xl py-2.5 pr-3 pl-2.5 shadow-xl shadow-black/20"
      role="status"
    >
      <span className="bg-background/15 relative grid size-8 shrink-0 place-items-center rounded-full">
        <AlertTriangle className="size-4" />
        <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
          <span
            className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", dot)}
          />
          <span className={cn("relative inline-flex size-2.5 rounded-full", dot)} />
        </span>
      </span>

      <span className="min-w-0 text-[13px] leading-snug font-medium">
        {label}
        {upcoming.amount ? ` — ${formatMoney(upcoming.amount)}` : ""}
      </span>

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="hover:bg-background/10 shrink-0 self-start rounded-full p-1.5 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
