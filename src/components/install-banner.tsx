"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "paytrack-install-dismissed";

/**
 * A gentle "install the app" card for the welcome screen. On Android/desktop
 * Chrome it drives the real install prompt; on iOS it shows the two manual
 * steps. It hides itself when the app is already installed or was dismissed.
 */
export default function InstallBanner() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (standalone || dismissed) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);
    if (ios) setVisible(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="animate-rise bg-card/70 relative mt-5 rounded-2xl border p-4 backdrop-blur">
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground absolute top-3 right-3 transition-colors"
      >
        <X className="size-4" />
      </button>
      <p className="pr-6 text-sm font-semibold">Install PayTrack</p>
      {isIOS ? (
        <p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-xs">
          <Share className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Tap <strong className="text-foreground">Share</strong>, then{" "}
            <strong className="text-foreground">Add to Home Screen</strong> to open it like an app.
          </span>
        </p>
      ) : (
        <>
          <p className="text-muted-foreground mt-1 text-xs">
            Add it to your home screen — opens full screen, no browser bar.
          </p>
          {deferred ? (
            <Button
              size="sm"
              className="mt-3 w-full"
              onClick={async () => {
                await deferred.prompt();
                await deferred.userChoice;
                setDeferred(null);
                setVisible(false);
              }}
            >
              <Download /> Install app
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
