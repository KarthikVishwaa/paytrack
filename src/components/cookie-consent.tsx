"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/button";

const KEY = "paytrack-cookie-consent";

/**
 * A one-time notice that the app uses cookies to keep you signed in and to
 * cache assets so it opens faster next time. The choice is remembered locally,
 * so it never shows again once answered.
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) {
        // Small delay so it slides in after the page settles.
        const t = setTimeout(() => setShow(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* private mode: just don't nag */
    }
  }, []);

  function decide(value: "accepted" | "declined") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="animate-rise safe-bottom fixed inset-x-3 bottom-20 z-[60] md:right-6 md:bottom-6 md:left-auto md:max-w-sm">
      <div className="bg-popover text-popover-foreground rounded-2xl border p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <span className="bg-primary/12 text-primary grid size-9 shrink-0 place-items-center rounded-xl">
            <Cookie className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">This app uses cookies</p>
            <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
              We use them to keep you signed in and cache the app so it opens faster next time.
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => decide("accepted")}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={() => decide("declined")}>
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
