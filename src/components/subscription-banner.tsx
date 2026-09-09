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
 * A dismissible strip for the soonest subscription renewal, so the team can
 * have the payment ready before it's due. Dismissing it only hides today's
 * reminder — it comes back tomorrow, a little more urgent, until the admin
 * pushes the date out or the renewal is handled.
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
  const label =
    upcoming.days < 0
      ? `${upcoming.title} is ${Math.abs(upcoming.days)} day${Math.abs(upcoming.days) === 1 ? "" : "s"} overdue`
      : upcoming.days === 0
        ? `${upcoming.title} renews today`
        : `${upcoming.title} renews in ${upcoming.days} day${upcoming.days === 1 ? "" : "s"}`;

  return (
    <div
      className={cn(
        "animate-rise flex items-center gap-2 border-b px-4 py-2 text-sm font-medium",
        urgent ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
      )}
      role="status"
    >
      <AlertTriangle className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">
        {label}
        {upcoming.amount ? ` — ${formatMoney(upcoming.amount)}` : ""}
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
