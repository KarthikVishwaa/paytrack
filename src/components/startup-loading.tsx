"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/**
 * A brief branded loader shown once per browser tab, the moment the app first
 * mounts — smooths over the gap before the first real page paints. Session-
 * scoped so it never reappears on later navigation within the same tab.
 */

const SHOW_MS = 550;
const FADE_MS = 300;

export default function StartupLoading() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("paytrack-booted")) return;
      sessionStorage.setItem("paytrack-booted", "1");
    } catch {
      return; // private mode — skip rather than block the app
    }
    setShow(true);
    const leaveTimer = setTimeout(() => setLeaving(true), SHOW_MS);
    const hideTimer = setTimeout(() => setShow(false), SHOW_MS + FADE_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className="bg-background fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
      style={{
        animation: leaving
          ? `fade ${FADE_MS}ms ease forwards reverse`
          : "fade 300ms ease both",
      }}
      aria-hidden
    >
      <span className="bg-primary text-primary-foreground animate-pop grid size-16 place-items-center rounded-2xl text-2xl font-bold shadow-lg">
        ₹
      </span>
      <p className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Loader2 className="size-4 animate-spin" />
        Loading PayTrack…
      </p>
    </div>
  );
}
