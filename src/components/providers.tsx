"use client";

import { SWRConfig } from "swr";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme";
import ServiceWorker from "@/components/service-worker";
import CookieConsent from "@/components/cookie-consent";
import AppLifecycle from "@/components/app-lifecycle";
import { swrConfig } from "@/lib/client";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SWRConfig value={swrConfig}>
        {children}
        <Toaster />
        <ServiceWorker />
        <CookieConsent />
        <AppLifecycle />
      </SWRConfig>
    </ThemeProvider>
  );
}
