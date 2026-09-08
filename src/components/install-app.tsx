"use client";

import { useEffect, useState } from "react";
import { Check, Download, Share } from "lucide-react";

import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "Add to home screen". Android and desktop Chrome fire beforeinstallprompt, which we hold on
 * to and replay when the button is tapped. iOS has no such event, so there we show the two
 * steps to do it by hand instead.
 */
export default function InstallApp() {
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Check className="text-success size-4" /> Installed on this device.
      </p>
    );
  }

  if (deferred) {
    return (
      <Button
        onClick={async () => {
          await deferred.prompt();
          const { outcome } = await deferred.userChoice;
          if (outcome === "accepted") setInstalled(true);
          setDeferred(null);
        }}
      >
        <Download /> Install app
      </Button>
    );
  }

  if (isIOS) {
    return (
      <p className="text-muted-foreground flex items-start gap-2 text-sm">
        <Share className="mt-0.5 size-4 shrink-0" />
        <span>
          In Safari, tap <strong className="text-foreground">Share</strong>, then{" "}
          <strong className="text-foreground">Add to Home Screen</strong>.
        </span>
      </p>
    );
  }

  return (
    <p className="text-muted-foreground text-sm">
      Open this page in Chrome on your phone and use{" "}
      <strong className="text-foreground">Add to Home screen</strong> from the browser menu. The
      button appears here once your browser offers it.
    </p>
  );
}
