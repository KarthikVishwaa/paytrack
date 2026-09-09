"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/client";
import { MEMBER_ROLES, ROLE_LABELS, type Role } from "@/lib/types";

interface Seats {
  open: boolean;
  started: boolean;
  taken: number;
  teamSize: number;
}

export default function SignupPage() {
  const router = useRouter();
  const [seats, setSeats] = useState<Seats | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "developer" as Role,
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Seats>("/api/auth/signup")
      .then(setSeats)
      .catch(() => setSeats({ open: false, started: true, taken: 0, teamSize: 0 }));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/signup", { method: "POST", body: JSON.stringify(form) });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const left = seats ? seats.teamSize - seats.taken : 0;

  return (
    <div className="flex min-h-[100dvh] flex-col justify-center px-4 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="bg-primary text-primary-foreground animate-pop mx-auto mb-3 grid size-14 place-items-center rounded-2xl text-xl font-bold shadow-lg">
            ₹
          </span>
          <h1 className="shimmer animate-rise text-3xl font-bold tracking-tight">Join the team</h1>
          <p className="text-muted-foreground animate-rise mt-1 text-sm" style={{ animationDelay: "90ms" }}>
            {seats === null
              ? "Checking for a free seat…"
              : seats.open
                ? "Create your own account — " +
                  left +
                  (left === 1 ? " seat left of " : " seats left of ") +
                  seats.teamSize +
                  "."
                : "No seats are free right now."}
          </p>
        </div>

        <Card className="animate-rise" style={{ animationDelay: "150ms" }}>
          <CardContent>
            {seats && !seats.open ? (
              <div className="space-y-4 text-center">
                <p className="bg-secondary text-secondary-foreground rounded-lg px-3 py-3 text-sm">
                  {seats.started
                    ? "All " +
                      seats.teamSize +
                      " accounts are taken. Ask the admin to free a seat or raise the team size."
                    : "The admin account has to be created first."}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>

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
                  <Label>Your role</Label>
                  <Select
                    value={form.role}
                    onValueChange={(v) => setForm({ ...form, role: v as Role })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEMBER_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
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
                  disabled={busy || seats === null}
                >
                  {busy ? <Loader2 className="animate-spin" /> : null}
                  Create my account
                </Button>

                <p className="text-muted-foreground text-center text-xs">
                  You can add and edit spending. Only the admin changes the budget or manages
                  accounts.
                </p>
                <p className="text-muted-foreground text-center text-xs">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
