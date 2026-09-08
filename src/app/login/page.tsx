"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import InstallBanner from "@/components/install-banner";
import { api } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"loading" | "login" | "setup">("loading");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ needsSetup: boolean }>("/api/auth/setup")
      .then((d) => setMode(d.needsSetup ? "setup" : "login"))
      .catch(() => setMode("login"));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(mode === "setup" ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="bg-primary text-primary-foreground animate-pop mx-auto mb-3 grid size-14 place-items-center rounded-2xl text-xl font-bold shadow-lg">
            ₹
          </span>
          <h1 className="shimmer animate-rise text-3xl font-bold tracking-tight">PayTrack</h1>
          <p className="text-muted-foreground animate-rise mt-1 text-sm" style={{ animationDelay: "90ms" }}>
            {mode === "setup"
              ? "Create the admin account to get started."
              : "Budget and spending for the app project."}
          </p>
        </div>

        <Card className="animate-rise" style={{ animationDelay: "150ms" }}>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {mode === "setup" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Karthik"
                    required
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "setup" ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={mode === "setup" ? "At least 8 characters" : "••••••••"}
                  required
                />
              </div>

              {error ? (
                <p className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border px-3 py-2 text-sm">
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={busy || mode === "loading"}
              >
                {busy ? <Loader2 className="animate-spin" /> : null}
                {mode === "setup" ? "Create admin account" : "Sign in"}
              </Button>

              {mode === "setup" ? (
                <p className="text-muted-foreground text-center text-xs">
                  You will be the host: only this account can set the budget and manage members.
                </p>
              ) : (
                <p className="text-muted-foreground text-center text-xs">
                  No account yet?{" "}
                  <Link href="/signup" className="text-primary font-semibold hover:underline">
                    Create your own
                  </Link>{" "}
                  if the team has a free seat.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <InstallBanner />
      </div>
    </div>
  );
}
