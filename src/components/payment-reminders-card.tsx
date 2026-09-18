"use client";

import { CalendarClock, Megaphone, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/money-ui";
import { useReminders, useSubscriptions } from "@/lib/client";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { daysUntil } from "@/lib/types";

type Row = {
  id: string;
  label: string;
  amount: number;
  days: number | null;
  kind: "subscription" | "reminder";
};

/** How far ahead a renewal counts as "upcoming" here. */
export const WINDOW_DAYS = 30;

function urgency(days: number | null): "overdue" | "urgent" | "soon" | "later" {
  if (days === null) return "later";
  if (days < 0) return "overdue";
  if (days <= 3) return "urgent";
  if (days <= 10) return "soon";
  return "later";
}

const TONE = {
  overdue: { text: "text-destructive", bg: "bg-destructive" },
  urgent: { text: "text-destructive", bg: "bg-destructive" },
  soon: { text: "text-warning", bg: "bg-warning" },
  later: { text: "text-foreground", bg: "bg-primary" },
};

function dueLabel(days: number | null): string {
  if (days === null) return "No date set";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days}d`;
}

/**
 * A standing card (not a floating pill) that lives in the normal page flow,
 * right under Budget usage — every upcoming subscription renewal and dated
 * admin reminder, always visible on the dashboard rather than popping up and
 * getting dismissed. The pulsing dot and soft sheen on the nearest one are
 * just "this is being watched live", not an alert you have to act on.
 */
export default function PaymentRemindersCard() {
  const { data: subsData } = useSubscriptions();
  const { data: remData } = useReminders();

  const rows: Row[] = [
    ...(subsData?.subscriptions ?? []).map((s) => ({
      id: `sub-${s._id}`,
      label: s.title,
      amount: s.amount,
      days: daysUntil(s.dueDate),
      kind: "subscription" as const,
    })),
    ...(remData?.reminders ?? []).map((r) => ({
      id: `rem-${r._id}`,
      label: r.message,
      amount: r.amount,
      days: r.dueDate ? daysUntil(r.dueDate) : null,
      kind: "reminder" as const,
    })),
  ]
    .filter((r) => r.days === null || r.days <= WINDOW_DAYS)
    .sort((a, b) => {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    });

  if (!subsData || !remData) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="text-muted-foreground size-4" />
          Payment reminders
        </CardTitle>
        {rows.length > 0 ? (
          <Badge variant="secondary" className="gap-1.5">
            <span className="live-dot text-success size-1.5">
              <span className="bg-success relative size-1.5 rounded-full" />
            </span>
            Live
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title="Nothing due" hint="Renewals and dated reminders will show up here." icon={Radio} />
        ) : (
          <ul className="stagger divide-y">
            {rows.map((row, i) => {
              const tone = TONE[urgency(row.days)];
              const nearest = i === 0 && row.days !== null && row.days <= WINDOW_DAYS;

              return (
                <li
                  key={row.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5 first:pt-0 last:pb-0",
                    nearest && cn("sheen-bg", tone.text)
                  )}
                >
                  <span className={cn("live-dot shrink-0 size-2", tone.text)}>
                    <span className={cn("relative size-2 rounded-full", tone.bg)} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.label}</p>
                    <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                      {row.kind === "reminder" ? <Megaphone className="size-3" /> : null}
                      <span className={tone.text}>{dueLabel(row.days)}</span>
                    </p>
                  </div>

                  {row.amount ? (
                    <span className="tabular shrink-0 text-sm font-semibold">
                      {formatMoney(row.amount)}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
