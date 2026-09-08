import { Skeleton } from "@/components/ui/skeleton";

/**
 * The instant fallback shown while a route's data loads. It paints the app
 * chrome (header + bottom tab bar) exactly where the real Shell will sit, so
 * navigation feels immediate and only the content area shows a skeleton — no
 * blank screen, no waiting on the old page. Kept dependency-free and static so
 * it renders with zero data.
 */
function ShellFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="bg-background/80 safe-top sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <div className="bg-primary/70 size-8 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-2 w-5" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-10">{children}</main>

      <nav className="bg-popover/95 safe-bottom fixed inset-x-0 bottom-0 z-30 border-t px-2 pt-3 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around pb-1.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="size-6 rounded-lg" />
          ))}
        </div>
      </nav>
    </div>
  );
}

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
    <ShellFrame>
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
    </ShellFrame>
  );
}
