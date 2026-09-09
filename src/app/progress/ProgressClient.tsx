"use client";

import { Check, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/money-ui";
import { CountNumber } from "@/components/count-up";
import { useSettings, useStages, useSummary } from "@/lib/client";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import {
  overallPercent,
  stagePercent,
  STAGE_STATUS_LABELS,
  type StageDoc,
  type StageStatus,
} from "@/lib/types";

const TONE: Record<
  StageStatus,
  { bar: string; badge: "success" | "warning" | "secondary" | "destructive" | "default" }
> = {
  not_started: { bar: "bg-muted-foreground/40", badge: "secondary" },
  in_progress: { bar: "bg-primary", badge: "default" },
  in_review: { bar: "bg-warning", badge: "warning" },
  completed: { bar: "bg-success", badge: "success" },
  blocked: { bar: "bg-destructive", badge: "destructive" },
};

export default function ProgressClient() {
  const stagesQuery = useStages();
  const settingsQuery = useSettings();
  const summaryQuery = useSummary();

  if (stagesQuery.error) {
    return (
      <ErrorState
        message={(stagesQuery.error as Error).message}
        onRetry={() => stagesQuery.mutate()}
      />
    );
  }

  const stages = stagesQuery.data?.stages;
  const settings = settingsQuery.data?.settings;

  if (!stages || !settings) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-40 rounded-2xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
    );
  }

  const overall = settings.roadmapPercent ?? overallPercent(stages);
  const current =
    stages.find((s) => s.status === "in_progress" || s.status === "in_review" || s.status === "blocked") ??
    stages.find((s) => s.status === "not_started") ??
    stages[stages.length - 1];
  const completed = stages.filter((s) => s.status === "completed").length;
  const summary = summaryQuery.data;

  return (
    <div className="space-y-4">
      <div className="animate-rise">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{settings.projectName}</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Project status — where the build stands, updated by the admin.
        </p>
      </div>

      <Card className="animate-rise">
        <CardContent className="px-4 py-1">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                Overall progress
              </p>
              <p className="tabular mt-1 text-4xl font-bold tracking-tight">
                <CountNumber value={overall} />%
              </p>
            </div>
            <span className="bg-primary/10 text-primary grid size-12 shrink-0 place-items-center rounded-2xl">
              <Rocket className="size-6" />
            </span>
          </div>

          <div className="mt-3">
            <Progress value={overall} indicatorClassName="bg-primary" />
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-t pt-3 text-center">
            <div>
              <dt className="text-muted-foreground text-[11px] font-medium">Current stage</dt>
              <dd className="mt-0.5 truncate px-1 text-sm font-semibold">
                {current ? current.name : "—"}
              </dd>
            </div>
            <div className="border-x">
              <dt className="text-muted-foreground text-[11px] font-medium">Stages done</dt>
              <dd className="tabular mt-0.5 text-sm font-semibold">
                {completed} / {stages.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-[11px] font-medium">Budget spent</dt>
              <dd className="tabular mt-0.5 text-sm font-semibold">
                {summary ? summary.totals.percentUsed + "%" : "—"}
              </dd>
            </div>
          </dl>

          {summary ? (
            <p className="text-muted-foreground mt-2.5 border-t pt-2.5 text-center text-xs">
              {formatMoney(summary.totals.spent, settings.currency)} of{" "}
              {formatMoney(summary.totals.budget, settings.currency)} planned
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="stagger space-y-3">
        {stages.map((stage) => (
          <StageRow key={stage._id} stage={stage} />
        ))}
      </div>
    </div>
  );
}

function StageRow({ stage }: { stage: StageDoc }) {
  const percent = stagePercent(stage);
  const tone = TONE[stage.status];

  return (
    <Card>
      <CardHeader className="px-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "tabular grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold",
              stage.status === "completed"
                ? "bg-success/15 text-success"
                : stage.status === "blocked"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-secondary text-muted-foreground"
            )}
          >
            {stage.status === "completed" ? <Check className="size-4" /> : stage.index + 1}
          </span>

          <div className="min-w-0 flex-1">
            <CardTitle className="text-[15px]">{stage.name}</CardTitle>
            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{stage.summary}</p>
          </div>

          <span className="tabular shrink-0 text-sm font-semibold">{percent}%</span>
        </div>

        <div className="mt-2.5">
          <Progress value={percent} indicatorClassName={tone.bar} className="h-1.5" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant={tone.badge}>{STAGE_STATUS_LABELS[stage.status]}</Badge>
        </div>

        {stage.status === "blocked" && stage.note ? (
          <p className="text-destructive mt-1.5 text-xs">{stage.note}</p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
