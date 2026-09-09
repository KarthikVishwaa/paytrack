"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import {
  CalendarClock,
  CalendarDays,
  ListChecks,
  PiggyBank,
  Repeat,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetBar, CardsSkeleton, EmptyState, ErrorState, StatCard } from "@/components/money-ui";
import { useSummary } from "@/lib/client";
import { formatDate, formatMoney } from "@/lib/money";
import { CATEGORY_COLORS, CATEGORY_LABELS, type ExpenseCategory } from "@/lib/types";

// Recharts is the heaviest dependency on this page, so it is fetched only once
// the dashboard is on screen rather than shipped with the first load.
const MonthBars = dynamic(() => import("./charts").then((m) => m.MonthBars), {
  ssr: false,
  loading: () => <Skeleton className="h-52 w-full sm:h-64" />,
});
const CategoryDonut = dynamic(() => import("./charts").then((m) => m.CategoryDonut), {
  ssr: false,
  loading: () => <Skeleton className="size-32 shrink-0 rounded-full" />,
});

export default function DashboardClient({ isAdmin }: { isAdmin: boolean }) {
  const { data, error, isLoading, mutate } = useSummary();

  if (error) {
    return <ErrorState message={(error as Error).message} onRetry={() => mutate()} />;
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <CardsSkeleton />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { totals, settings, byCategory, byMonth, byMember } = data;
  const currency = settings.currency;
  const overBudget = totals.remaining < 0;
  const tight = !overBudget && totals.percentUsed > 80;
  const overCap =
    totals.monthlyInfraBudget > 0 && totals.monthlyRunRate > totals.monthlyInfraBudget;

  const monthData = byMonth.map((m) => ({
    month: new Date(m.month + "-01T00:00:00").toLocaleDateString("en-IN", { month: "short" }),
    Spent: m.spent,
  }));

  const pieData = byCategory.map((c) => ({
    name: CATEGORY_LABELS[c.category as ExpenseCategory] ?? c.category,
    value: c.amount,
    color: CATEGORY_COLORS[c.category as ExpenseCategory] ?? "var(--cat-other)",
  }));

  return (
    <div className="space-y-4">
      <div className="animate-rise flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            {settings.projectName}
          </h1>
          {settings.updatedBy === "system" && isAdmin ? (
            <p className="text-muted-foreground mt-0.5 text-sm">
              Default budget — change it in Admin
            </p>
          ) : null}
        </div>
        <Button asChild className="hidden sm:inline-flex">
          <Link href="/expenses" prefetch>
            Add spending
          </Link>
        </Button>
      </div>

      {overBudget ? (
        <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-3 text-sm font-medium">
          Over budget by {formatMoney(Math.abs(totals.remaining), currency)}.
          {isAdmin ? " Raise the budget in Admin or cut spending." : " Tell the admin."}
        </div>
      ) : tight ? (
        <div className="border-warning/30 bg-warning/10 text-warning rounded-xl border px-4 py-3 text-sm font-medium">
          {totals.percentUsed}% of the budget is used — {formatMoney(totals.remaining, currency)}{" "}
          left.
        </div>
      ) : null}

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Budget"
          count={{ amount: totals.budget, currency }}
          hint="Total available"
          icon={PiggyBank}
        />
        <StatCard
          label="Spent"
          count={{ amount: totals.spent, currency }}
          hint={
            totals.expenseCount +
            (totals.expenseCount === 1 ? " entry · " : " entries · ") +
            totals.percentUsed +
            "%"
          }
          tone={overBudget ? "bad" : tight ? "warn" : "default"}
          icon={Wallet}
        />
        <StatCard
          label="Remaining"
          count={{ amount: totals.remaining, currency }}
          hint={overBudget ? "Budget exceeded" : "Left to spend"}
          tone={overBudget ? "bad" : "good"}
          icon={TrendingUp}
        />
        <StatCard
          label="This month"
          count={{ amount: totals.thisMonth, currency }}
          hint="Logged so far this month"
          icon={CalendarDays}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Budget usage</CardTitle>
          <Badge variant={overBudget ? "destructive" : tight ? "warning" : "secondary"}>
            {totals.percentUsed}% used
          </Badge>
        </CardHeader>
        <CardContent>
          <BudgetBar used={totals.spent} total={totals.budget} currency={currency} />
        </CardContent>
      </Card>

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Monthly cost"
          count={{ amount: totals.monthlyRunRate, currency }}
          hint="Everything marked monthly"
          tone={overCap ? "warn" : "default"}
          icon={Repeat}
        />
        <StatCard
          label="Monthly cap"
          count={{ amount: totals.monthlyInfraBudget, currency }}
          hint={overCap ? "Run rate is above this" : "Recurring limit"}
          tone={overCap ? "warn" : "default"}
        />
        <StatCard
          label="Runway"
          value={totals.runwayMonths === null ? "—" : totals.runwayMonths + " mo"}
          hint="Remaining ÷ monthly cost"
          tone={totals.runwayMonths !== null && totals.runwayMonths < 3 ? "warn" : "default"}
          icon={CalendarClock}
        />
        <StatCard
          label="Entries"
          count={{ amount: totals.expenseCount, kind: "number" }}
          hint="Logged by the team"
          icon={ListChecks}
        />
      </div>

      <div className="stagger grid gap-3 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Spending by month</CardTitle>
          </CardHeader>
          <CardContent>
            {monthData.length === 0 ? (
              <EmptyState title="Nothing logged yet" hint="Add spending to see the trend." />
            ) : (
              <MonthBars data={monthData} currency={currency} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Where the money went</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <EmptyState title="No spending yet" icon={Wallet} />
            ) : (
              <div className="flex items-center gap-3">
                <CategoryDonut data={pieData} currency={currency} />
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {pieData.slice(0, 6).map((c) => (
                    <li key={c.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: c.color }}
                      />
                      <span className="text-muted-foreground truncate">{c.name}</span>
                      <span className="tabular ml-auto shrink-0 font-medium">
                        {formatMoney(c.value, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="stagger grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Latest spending</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/expenses" prefetch>
                See all
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentExpenses.length === 0 ? (
              <EmptyState
                title="No spending logged yet"
                hint="Add the first entry from the Spending tab."
                icon={Wallet}
              />
            ) : (
              <ul className="divide-y">
                {data.recentExpenses.map((e) => (
                  <li key={e._id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {formatDate(e.date)} · {CATEGORY_LABELS[e.category] ?? e.category} ·{" "}
                        {e.createdByName}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold">
                      {formatMoney(e.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Who logged what</CardTitle>
          </CardHeader>
          <CardContent>
            {byMember.length === 0 ? (
              <EmptyState title="Nothing logged yet" />
            ) : (
              <ul className="divide-y">
                {byMember.map((m) => (
                  <li key={m.name} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {m.count} {m.count === 1 ? "entry" : "entries"}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold">
                      {formatMoney(m.spent, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
