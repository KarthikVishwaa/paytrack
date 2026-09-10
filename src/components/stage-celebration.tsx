"use client";

import { useEffect, useMemo, useState } from "react";
import { PartyPopper } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useStages } from "@/lib/client";
import type { StageDoc } from "@/lib/types";

const STORAGE_KEY = "paytrack-celebrated-stages";
const AUTO_CLOSE_MS = 6000;
const PIECE_COUNT = 40;
const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#ef4444", "#a855f7"];

/**
 * Announces a stage the moment it's marked complete — to everyone, wherever
 * they are in the app. Tracked per browser (not per account) so it survives
 * across sessions: a stage that was already done before this browser's
 * first-ever visit is the starting line, not breaking news, so nothing
 * fires for those. Only a stage that turns complete after that gets a
 * celebration, and only once.
 */
export default function StageCelebration() {
  const { data } = useStages();
  const [queue, setQueue] = useState<StageDoc[]>([]);

  useEffect(() => {
    const stages = data?.stages;
    if (!stages) return;

    let known: string[] | null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      known = raw ? (JSON.parse(raw) as string[]) : null;
    } catch {
      return; // private mode — skip rather than risk celebrating the same stage forever
    }

    const completed = stages.filter((s) => s.status === "completed");

    if (known === null) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(completed.map((s) => s._id)));
      } catch {
        // ignore
      }
      return;
    }

    const fresh = completed.filter((s) => !known!.includes(s._id));
    if (fresh.length === 0) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...known, ...fresh.map((s) => s._id)]));
    } catch {
      // ignore
    }
    setQueue((q) => [...q, ...fresh]);
  }, [data?.stages]);

  if (queue.length === 0) return null;

  const stage = queue[0];
  const dismiss = () => setQueue((q) => q.slice(1));

  return <CelebrationOverlay key={stage._id} stage={stage} onClose={dismiss} />;
}

function CelebrationOverlay({ stage, onClose }: { stage: StageDoc; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  const pieces = useMemo(
    () => Array.from({ length: PIECE_COUNT }, (_, i) => confettiPiece(i)),
    []
  );

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-6"
      role="dialog"
      aria-label={stage.name + " completed"}
      onClick={onClose}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {pieces.map((piece, i) => (
          <span key={i} className="confetti-piece" style={piece} />
        ))}
      </div>

      <div
        className="animate-pop relative flex w-full max-w-xs flex-col items-center rounded-3xl border bg-popover p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="bg-primary/15 text-primary grid size-16 place-items-center rounded-full">
          <PartyPopper className="size-8" />
        </span>
        <p className="text-primary mt-3 text-xs font-semibold tracking-wide uppercase">
          Stage {stage.index + 1} complete
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">{stage.name}</h2>
        <p className="text-muted-foreground mt-1.5 text-sm">{stage.summary}</p>
        <Button className="mt-5 w-full" onClick={onClose}>
          Nice!
        </Button>
      </div>
    </div>
  );
}

/** A deterministic pseudo-random burst direction per piece — cheap, stable, no Math.random re-renders. */
function confettiPiece(i: number): React.CSSProperties {
  const angle = (i * 47) % 360;
  const distance = 26 + ((i * 13) % 50);
  const rad = (angle * Math.PI) / 180;
  const color = COLORS[i % COLORS.length];
  const size = 6 + (i % 4) * 2;

  return {
    left: "50%",
    top: "38%",
    width: size,
    height: size * 0.4,
    background: color,
    animationDelay: (i % 10) * 35 + "ms",
    animationDuration: 1300 + (i % 6) * 180 + "ms",
    ["--dx" as string]: Math.cos(rad) * distance + "vw",
    ["--dy" as string]: Math.sin(rad) * distance + "vh",
    ["--rot" as string]: ((i * 71) % 360) + "deg",
  } as React.CSSProperties;
}
