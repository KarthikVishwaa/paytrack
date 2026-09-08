import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CountMoney, CountNumber } from "@/components/count-up";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

export function StatCard({
  label,
  value,
  count,
  hint,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  /** Static fallback shown when no `count` is given (e.g. "—"). */
  value?: string;
  /** When set, the figure counts up from zero on load. */
  count?: { amount: number; currency?: string; kind?: "money" | "number" };
  hint?: string;
  tone?: "default" | "good" | "warn" | "bad";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const toneClass = {
    default: "text-foreground",
    good: "text-success",
    warn: "text-warning",
    bad: "text-destructive",
  }[tone];

  const figure = cn("tabular mt-1 text-xl font-bold tracking-tight sm:text-2xl", toneClass);

  return (
    <Card className="gap-2 py-3.5">
      <div className="flex items-start gap-2 px-4">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {label}
          </p>
          {count ? (
            <p className={figure}>
              {count.kind === "number" ? (
                <CountNumber value={count.amount} />
              ) : (
                <CountMoney value={count.amount} currency={count.currency} />
              )}
            </p>
          ) : (
            <p className={figure}>{value}</p>
          )}
          {hint ? <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p> : null}
        </div>
        {Icon ? (
          <span className="bg-secondary text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg">
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function BudgetBar({
  used,
  total,
  currency,
}: {
  used: number;
  total: number;
  currency?: string;
}) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  const over = used > total;
  const indicator = over ? "bg-destructive" : pct > 80 ? "bg-warning" : "bg-primary";

  return (
    <div>
      <Progress value={pct} indicatorClassName={indicator} />
      <div className="text-muted-foreground tabular mt-2 flex justify-between text-xs">
        <span>{formatMoney(used, currency)} spent</span>
        <span>{formatMoney(total, currency)} budget</span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  icon: Icon,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      {Icon ? (
        <span className="bg-secondary text-muted-foreground mb-3 grid size-10 place-items-center rounded-full">
          <Icon className="size-5" />
        </span>
      ) : null}
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="text-muted-foreground mt-1 text-sm">{hint}</p> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border px-4 py-4 text-sm">
      <p className="font-medium">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-2 text-xs font-semibold underline underline-offset-4">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16" />
      ))}
    </div>
  );
}
