"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "paytrack-tour-seen";
const START_DELAY_MS = 1000;

const DESCRIPTIONS: Record<string, string> = {
  "/dashboard": "Your budget, spending and runway at a glance.",
  "/expenses": "Log and manage what the project has spent.",
  "/progress": "See how the build is coming along.",
  "/settings": "Switch the theme and manage your account.",
};

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * A one-time walk-through of the bottom tab bar for first-time users: each
 * step dims the rest of the screen, rings the icon being explained, and
 * lets them step through with Next — or skip the whole thing with one tap.
 * Mobile only, since that's the only place this tab bar exists.
 */
export default function OnboardingTour({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const steps = links.filter((l) => l.href !== "/admin");
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  // Decide once, after the shell has settled, whether to start the tour.
  useEffect(() => {
    if (steps.length === 0) return;
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return;
      } catch {
        return;
      }
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      setActive(true);
    }, START_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentLabel = steps[step]?.label;

  // Track the current step's icon on screen, so the ring and card follow it.
  // Depends on the label text (a stable primitive), not the steps array —
  // that array is a new reference on every render, which would otherwise
  // retrigger this effect endlessly.
  useEffect(() => {
    if (!active || !currentLabel) return;

    const measure = () => {
      const button = [...document.querySelectorAll<HTMLElement>(".menu__item")].find(
        (el) => el.getAttribute("aria-label") === currentLabel
      );
      if (!button) {
        setRect(null);
        return;
      }
      const r = button.getBoundingClientRect();
      setRect({ left: r.left, top: r.top, width: r.width, height: r.height });
    };

    measure();
    window.addEventListener("resize", measure);
    // The tab bar's own lift/notch animation moves the icon briefly — keep tracking it.
    const raf = requestAnimationFrame(measure);
    return () => {
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [active, currentLabel]);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // private mode — just stop for this visit
    }
    setActive(false);
  }

  function next() {
    if (step + 1 >= steps.length) finish();
    else setStep(step + 1);
  }

  if (!active || steps.length === 0) return null;

  const current = steps[step];

  return (
    <>
      <div className="animate-rise fixed inset-0 z-[25] bg-black/70" aria-hidden />

      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-40 rounded-2xl ring-4 ring-primary transition-all duration-300"
          style={{
            left: rect.left - 4,
            top: rect.top - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 24px 4px var(--primary)",
          }}
        />
      ) : null}

      <div
        className="fixed inset-x-0 z-40 flex justify-center px-4"
        style={{ bottom: rect ? window.innerHeight - rect.top + 14 : 96 }}
        role="dialog"
        aria-label="Bottom bar walk-through"
      >
        <div className="bg-popover text-popover-foreground animate-rise w-full max-w-xs rounded-2xl border p-4 shadow-xl">
          <p className="text-sm font-semibold">{current.label}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {DESCRIPTIONS[current.href] ?? "Tap here to get around the app."}
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex gap-1" aria-hidden>
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === step ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={finish}
                className="text-muted-foreground px-2 py-1.5 text-sm font-medium hover:text-foreground"
              >
                I know
              </button>
              <Button size="sm" onClick={next}>
                {step + 1 >= steps.length ? "Done" : "Next"}
                {step + 1 >= steps.length ? null : <ArrowRight />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
