"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Moon,
  Rocket,
  Settings2,
  SlidersHorizontal,
  Sun,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme";
import RoutingTabBar, { type TabLink } from "@/components/routing-tab-bar";
import NavProgress from "@/components/nav-progress";
import StartupLoading from "@/components/startup-loading";
import SubscriptionBanner from "@/components/subscription-banner";
import OnboardingTour from "@/components/onboarding-tour";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type SessionUser } from "@/lib/types";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Spending", icon: Wallet },
  { href: "/progress", label: "Status", icon: Rocket },
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

  const tabLinks: TabLink[] = links.map((link) => {
    const Icon = link.icon;
    return {
      href: link.href,
      label: link.label,
      icon: <Icon className="icon" aria-hidden />,
    };
  });

  const firstName = user.name.split(" ")[0] || user.name;
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <NavProgress />
      <StartupLoading />
      <OnboardingTour links={links} />

      <header className="bg-background/80 safe-top sticky top-0 z-30 border-b backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4">
          <Link
            href="/dashboard"
            prefetch
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            onClick={() => window.dispatchEvent(new Event("nav:start"))}
          >
            <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-bold shadow-sm">
              ₹
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-medium text-muted-foreground">Hi,</span>
              <span className="block text-sm font-semibold tracking-tight">{firstName}</span>
            </span>
          </Link>

          {/* Desktop navigation. On phones the tab bar at the bottom takes over. */}
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onClick={() => window.dispatchEvent(new Event("nav:start"))}
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
              {resolved === "dark" ? <Sun className="animate-pop" /> : <Moon className="animate-pop" />}
            </Button>
            <Link
              href="/settings"
              prefetch
              aria-label="Settings"
              onClick={() => window.dispatchEvent(new Event("nav:start"))}
              className="bg-secondary text-secondary-foreground grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold transition-transform active:scale-95"
              title={`${user.name} · ${ROLE_LABELS[user.role]}`}
            >
              {initials || "?"}
            </Link>
          </div>
        </div>
      </header>

      <SubscriptionBanner />

      {/* pb leaves room for the mobile tab bar so nothing hides behind it.
          key on the pathname replays the swap animation on every route change. */}
      <main
        key={pathname}
        className="animate-page mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-10"
      >
        {children}
      </main>

      <nav
        className="bg-popover/95 safe-bottom fixed inset-x-0 bottom-0 z-30 border-t px-2 pt-3 backdrop-blur-xl md:hidden"
        style={{ ["--menu-bg" as string]: "var(--popover)" }}
      >
        <div className="mx-auto max-w-md">
          <RoutingTabBar links={tabLinks} />
        </div>
      </nav>
    </div>
  );
}
