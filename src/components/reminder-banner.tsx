"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

import NoticePill from "@/components/notice-pill";
import { useReminders } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { daysUntil } from "@/lib/types";

const STORAGE_KEY = "paytrack-reminders-dismissed";

/**
 * Free-form notices the admin posts for everyone — "need ₹50,000 for the
 * next stage by the 10th" — as floating pills stacked at the top of every
 * page, like a turn-by-turn nav card: they sit on top of the content instead
 * of pushing it down, and stay put while the page scrolls underneath. Swipe
 * one right or up (or tap the ×) to dismiss.
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
          <NoticePill key={r._id} icon={Megaphone} dotColor="bg-primary" onDismiss={() => dismiss(r._id)}>
            {r.message}
            {r.amount ? " — " + formatMoney(r.amount) : ""}
            {suffix}
          </NoticePill>
        );
      })}
    </>
  );
}
