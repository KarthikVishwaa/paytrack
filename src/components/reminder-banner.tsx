"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

import { useReminders } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { daysUntil } from "@/lib/types";

const STORAGE_KEY = "paytrack-reminders-dismissed";

/**
 * Free-form notices the admin posts for everyone — "need ₹50,000 for the
 * next stage by the 10th" — as floating pills stacked at the top of every
 * page, like a turn-by-turn nav card: they sit on top of the content instead
 * of pushing it down, and stay put while the page scrolls underneath. The
 * "live" dot is a plain CSS animation, not a JS interval, so it costs
 * nothing on battery no matter how long it's left on screen.
 *
 * Unlike the subscription pill, closing one here is for good: these aren't
 * recurring, so it stays hidden on this browser until the admin deletes it
 * (which removes it for everyone) or storage is cleared.
 */
export default function ReminderBanner() {
  const { data } = useReminders();
  const [dismissed, setDismissed] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setDismissed(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setDismissed([]);
    }
  }, []);

  if (dismissed === null) return null;
  const reminders = (data?.reminders ?? []).filter((r) => !dismissed.includes(r._id));
  if (reminders.length === 0) return null;

  function dismiss(id: string) {
    const next = [...dismissed!, id];
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // private mode — stays hidden for this render only
    }
  }

  return (
    <>
      {reminders.map((r) => {
        const days = r.dueDate ? daysUntil(r.dueDate) : null;
        const suffix =
          days === null
            ? ""
            : days < 0
              ? ` (${Math.abs(days)}d overdue)`
              : days === 0
                ? " (today)"
                : ` (in ${days}d)`;

        return (
          <div
            key={r._id}
            className="pointer-events-auto animate-rise bg-foreground text-background flex max-w-[min(22rem,calc(100vw-2rem))] items-center gap-3 rounded-3xl py-2.5 pr-3 pl-2.5 shadow-xl shadow-black/20"
            role="status"
          >
            <span className="bg-background/15 relative grid size-8 shrink-0 place-items-center rounded-full">
              <Megaphone className="size-4" />
              <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                <span className="bg-primary absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                <span className="bg-primary relative inline-flex size-2.5 rounded-full" />
              </span>
            </span>

            <span className="min-w-0 text-[13px] leading-snug font-medium">
              {r.message}
              {r.amount ? " — " + formatMoney(r.amount) : ""}
              {suffix}
            </span>

            <button
              onClick={() => dismiss(r._id)}
              aria-label="Dismiss"
              className="hover:bg-background/10 shrink-0 self-start rounded-full p-1.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </>
  );
}
