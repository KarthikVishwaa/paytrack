"use client";

import { useRouter, usePathname } from "next/navigation";

import { AnimatedTabBar, type TabItem } from "@/components/ui/animated-tab-bar";

export interface TabLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

/**
 * Wires the animated tab bar up to the router: tapping a tab slides the notch,
 * kicks off the top loading bar for instant feedback, then navigates.
 */
export default function RoutingTabBar({ links }: { links: TabLink[] }) {
  const router = useRouter();
  const pathname = usePathname();

  const active = Math.max(
    0,
    links.findIndex((l) => l.href === pathname)
  );
  const items: TabItem[] = links.map((l) => ({ icon: l.icon, label: l.label }));

  return (
    <AnimatedTabBar
      items={items}
      activeIndex={active}
      onTabChange={(i) => {
        if (links[i].href === pathname) return;
        window.dispatchEvent(new Event("nav:start"));
        router.push(links[i].href);
      }}
    />
  );
}
