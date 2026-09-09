import { Skeleton } from "@/components/ui/skeleton";

/**
 * The instant fallback shown while a route's data loads. The header and
 * bottom tab bar live in the shared (app) layout now, so they stay mounted
 * across navigation — this only ever needs to paint the content area.
 */

function TitleBlock() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="h-3.5 w-64 max-w-full" />
    </div>
  );
}

function StatGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[92px] rounded-2xl" />
      ))}
    </div>
  );
}

export type LoadingVariant = "dashboard" | "list" | "settings" | "form";

export default function AppLoading({ variant = "dashboard" }: { variant?: LoadingVariant }) {
  return (
    <>
      <div className="space-y-4">
        <TitleBlock />

        {variant === "dashboard" ? (
          <>
            <StatGrid />
            <Skeleton className="h-24 rounded-2xl" />
            <StatGrid />
            <div className="grid gap-3 lg:grid-cols-5">
              <Skeleton className="h-64 rounded-2xl lg:col-span-3" />
              <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
            </div>
          </>
        ) : null}

        {variant === "list" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-16 rounded-2xl" />
              <Skeleton className="h-16 rounded-2xl" />
            </div>
            <div className="space-y-3 rounded-2xl border p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </>
        ) : null}

        {variant === "settings" ? (
          <>
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </>
        ) : null}

        {variant === "form" ? (
          <>
            <Skeleton className="h-80 rounded-2xl" />
            <Skeleton className="h-52 rounded-2xl" />
          </>
        ) : null}
      </div>
    </>
  );
}
