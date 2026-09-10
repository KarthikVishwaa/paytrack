"use client";

import { useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

import { useReminders } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { daysUntil } from "@/lib/types";

const STORAGE_KEY = "paytrack-reminders-dismissed";

/**
 * Free-form notices the admin posts for everyone — "need ₹50,000 for the
 * next stage by the 10th" — stacked at the top of every page until closed.
 * Unlike the subscription banner, closing one here is for good: these
 * aren't recurring, so it stays hidden on this browser until the admin
 * deletes it (which removes it for everyone) or storage is cleared.
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
    <div className="divide-y border-b">
      {reminders.map((r) => {
        const days = r.dueDate ? daysUntil(r.dueDate) : null;
        return (
          <div
            key={r._id}
            className="animate-rise bg-primary/10 flex items-center gap-2 px-4 py-2 text-sm"
            role="status"
          >
            <Megaphone className="text-primary size-4 shrink-0" />
            <span className="min-w-0 flex-1">
              {r.message}
              {r.amount ? " — " + formatMoney(r.amount) : ""}
              {days === null
                ? ""
                : days < 0
                  ? ` (${Math.abs(days)}d overdue)`
                  : days === 0
                    ? " (today)"
                    : ` (in ${days}d)`}
            </span>
            <button
              onClick={() => dismiss(r._id)}
              aria-label="Dismiss"
              className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
