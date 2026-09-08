"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Moon, Settings2, SlidersHorizontal, Sun, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type SessionUser } from "@/lib/types";

const LINKS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/expenses", label: "Spending", icon: Wallet },
];

const SETTINGS_LINK = { href: "/settings", label: "Settings", icon: SlidersHorizontal };

export default function Shell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { resolved, setTheme } = useTheme();

  const links =
    user.role === "admin"
      ? [...LINKS, { href: "/admin", label: "Admin", icon: Settings2 }, SETTINGS_LINK]
      : [...LINKS, SETTINGS_LINK];

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="bg-background/80 safe-top sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
          >
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-bold shadow-sm">
              ₹
            </span>
            <span className="hidden sm:inline">PayTrack</span>
          </Link>

          {/* Desktop navigation. On phones the tab bar at the bottom takes over. */}
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
              aria-label={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolved === "dark" ? (
                <Sun className="animate-pop" />
              ) : (
                <Moon className="animate-pop" />
              )}
            </Button>
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-muted-foreground text-xs">{ROLE_LABELS[user.role]}</p>
            </div>
            <Link
              href="/settings"
              aria-label="Settings"
              className="bg-secondary text-secondary-foreground grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold transition-transform active:scale-95"
            >
              {initials || "?"}
            </Link>
          </div>
        </div>
      </header>

      {/* pb leaves room for the mobile tab bar so nothing hides behind it.
          key on the pathname replays the swap animation on every route change. */}
      <main
        key={pathname}
        className="animate-page mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-10"
      >
        {children}
      </main>

      <nav className="bg-background/85 safe-bottom fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl md:hidden">
        <div
          className="mx-auto grid max-w-md px-2 pt-1.5"
          style={{ gridTemplateColumns: "repeat(" + links.length + ", minmax(0, 1fr))" }}
        >
          {links.map((link) => {
            const active = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {/* A rounded pill hugs the whole tab behind the active one. */}
                <span
                  className={cn(
                    "bg-primary/12 absolute inset-x-2 inset-y-0.5 rounded-2xl transition-all duration-300 ease-out",
                    active ? "scale-100 opacity-100" : "scale-90 opacity-0"
                  )}
                />
                <Icon
                  className={cn(
                    "relative size-5 transition-transform duration-300",
                    active ? "-translate-y-0.5 scale-110" : "group-active:scale-90"
                  )}
                />
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
