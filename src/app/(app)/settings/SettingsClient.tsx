"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme, type Theme } from "@/components/theme";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, type SessionUser } from "@/lib/types";

const OPTIONS: { value: Theme; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Black", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

export default function SettingsClient({ user }: { user: SessionUser }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="stagger space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Settings</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          How the app looks on this device, and your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>
            Dark is true black — kinder at night and lighter on an OLED battery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm font-medium transition-all duration-200 active:scale-[0.97]",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground">{user.email}</p>
            <p className="text-muted-foreground mt-1">{ROLE_LABELS[user.role]}</p>
          </div>
          <Button variant="outline" onClick={logout} disabled={busy}>
            <LogOut /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
