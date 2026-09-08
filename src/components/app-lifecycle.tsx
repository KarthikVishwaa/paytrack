"use client";

import { useEffect } from "react";
import { mutate } from "swr";

import { abortInFlight } from "@/lib/client";

/**
 * Stops the app doing anything once you leave it.
 *
 * A hidden tab is still a live page: timers keep firing and requests keep
 * running, which quietly costs battery. So when the tab is hidden we broadcast
 * `app:suspend` (timers and animations listen for it and stop), and when the
 * tab is actually closed or frozen we abort every request still in the air.
 * Coming back — including from the back/forward cache — refreshes the data so
 * nothing on screen is stale.
 */
export default function AppLifecycle() {
  useEffect(() => {
    const suspend = () => window.dispatchEvent(new Event("app:suspend"));

    const onVisibility = () => {
      if (document.visibilityState === "hidden") suspend();
      else window.dispatchEvent(new Event("app:resume"));
    };

    // pagehide fires on close, navigation away and when a phone freezes the tab.
    const onPageHide = (event: PageTransitionEvent) => {
      suspend();
      // If the page is only being frozen it may come back, and the in-flight
      // requests would resume with it — but if it is going away for good,
      // drop them so nothing lingers.
      if (!event.persisted) abortInFlight();
    };

    // Restored from the back/forward cache: the data may have moved on.
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) mutate(() => true);
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
