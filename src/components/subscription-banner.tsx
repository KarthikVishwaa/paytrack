"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import NoticePill from "@/components/notice-pill";
import { useSubscriptions } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { daysUntil } from "@/lib/types";

/** How far ahead a renewal starts showing up as a reminder. */
export const WINDOW_DAYS = 30;

/**
 * A floating pill for the soonest subscription renewal — like a turn-by-turn
 * nav card, it sits on top of the page and never pushes content around, and
 * stays in place while the page scrolls underneath. Swipe it right or up (or
 * tap the ×) to dismiss.
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
  const label =
    upcoming.days < 0
      ? `${upcoming.title} is ${Math.abs(upcoming.days)} day${Math.abs(upcoming.days) === 1 ? "" : "s"} overdue`
      : upcoming.days === 0
        ? `${upcoming.title} renews today`
        : `${upcoming.title} renews in ${upcoming.days} day${upcoming.days === 1 ? "" : "s"}`;

  return (
    <NoticePill icon={AlertTriangle} dotColor={urgent ? "bg-destructive" : "bg-warning"} onDismiss={dismiss}>
      {label}
      {upcoming.amount ? ` — ${formatMoney(upcoming.amount)}` : ""}
    </NoticePill>
  );
}
