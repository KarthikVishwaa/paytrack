import type { Metadata, Viewport } from "next";
import Providers from "@/components/providers";
import { themeScript } from "@/components/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "PayTrack",
  description: "Budget and spending for the app project.",
  applicationName: "PayTrack",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "PayTrack", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-apple.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  // When the on-screen keyboard opens, shrink the layout so bottom-anchored
  // sheets (the Add spending form) stay fully above it instead of hiding under.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Sets the theme before the first paint so there is never a flash of the wrong one. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-[100dvh]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
