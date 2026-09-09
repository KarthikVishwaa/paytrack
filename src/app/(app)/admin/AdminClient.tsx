"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  DatabaseBackup,
  Download,
  KeyRound,
  RotateCcw,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/money-ui";
import { WINDOW_DAYS } from "@/components/subscription-banner";
import {
  api,
  refreshAll,
  useBackups,
  useSettings,
  useStages,
  useSubscriptions,
  useUsers,
} from "@/lib/client";
import { formatMoney, todayISO } from "@/lib/money";
import {
  daysUntil,
  ROLES,
  ROLE_LABELS,
  STAGE_STATUSES,
  STAGE_STATUS_LABELS,
  type Role,
  type SettingsDoc,
  type StageDoc,
  type StageStatus,
  type SubscriptionDoc,
  type UserDoc,
} from "@/lib/types";

type SafeUser = Omit<UserDoc, "passwordHash">;

const DEFAULT_BUDGET = 522000;

export default function AdminClient({ meId }: { meId: string }) {
  const settingsQuery = useSettings();
  const usersQuery = useUsers();
  const backupsQuery = useBackups();
  const stagesQuery = useStages();
  const subscriptionsQuery = useSubscriptions();

  const settings = settingsQuery.data?.settings;
  const users = usersQuery.data?.users;
  const backups = backupsQuery.data?.backups;
  const stages = stagesQuery.data?.stages;
  const subscriptions = subscriptionsQuery.data?.subscriptions;

  const [budgetForm, setBudgetForm] = useState({
    projectName: "",
    currency: "INR",
    totalBudget: "",
    monthlyInfraBudget: "",
    teamSize: "",
    usdRate: "",
    roadmapPercent: "",
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "developer" as Role,
    password: "",
  });
  const [newSubscription, setNewSubscription] = useState({ title: "", dueDate: "", amount: "" });
  const [busy, setBusy] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  // Fill the form once the saved settings arrive.
  useEffect(() => {
    if (!settings) return;
    setBudgetForm({
      projectName: settings.projectName,
      currency: settings.currency,
      totalBudget: String(settings.totalBudget),
      monthlyInfraBudget: String(settings.monthlyInfraBudget),
      teamSize: String(settings.teamSize),
      usdRate: String(settings.usdRate),
      roadmapPercent: settings.roadmapPercent === null ? "" : String(settings.roadmapPercent),
    });
  }, [settings]);

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    setBusy("budget");
    try {
      const res = await api<{ settings: SettingsDoc }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(budgetForm),
      });
      settingsQuery.mutate({ settings: res.settings }, { revalidate: false });
      toast.success("Budget saved");
      refreshAll();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy("user");
    try {
      await api("/api/users", { method: "POST", body: JSON.stringify(newUser) });
      toast.success(newUser.name + " can sign in now");
      setNewUser({ name: "", email: "", role: "developer", password: "" });
      usersQuery.mutate();
      refreshAll();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function patchUser(id: string, patch: Record<string, unknown>, okMessage: string) {
    try {
      await api("/api/users/" + id, { method: "PATCH", body: JSON.stringify(patch) });
      toast.success(okMessage);
      usersQuery.mutate();
    } catch (err) {
      toast.error((err as Error).message);
      usersQuery.mutate();
    }
  }

  async function removeUser(u: SafeUser) {
    if (!confirm("Remove " + u.name + "? Their past entries stay in the reports.")) return;
    try {
      await api("/api/users/" + u._id, { method: "DELETE" });
      toast.success(u.name + " was removed");
      usersQuery.mutate();
      refreshAll();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function resetPassword(u: SafeUser) {
    const password = prompt("New password for " + u.name + " (at least 8 characters):");
    if (!password) return;
    patchUser(u._id, { password }, "Password updated for " + u.name);
  }

  async function setStageStatus(stage: StageDoc, status: StageStatus) {
    try {
      await api("/api/stages/" + stage._id, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          note: status === "blocked" ? (noteDrafts[stage._id] ?? stage.note) : "",
        }),
      });
      toast.success(stage.name + " marked " + STAGE_STATUS_LABELS[status].toLowerCase());
      stagesQuery.mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function saveStageNote(stage: StageDoc) {
    try {
      await api("/api/stages/" + stage._id, {
        method: "PATCH",
        body: JSON.stringify({ note: noteDrafts[stage._id] ?? stage.note }),
      });
      toast.success("Note saved");
      stagesQuery.mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function addSubscription(e: React.FormEvent) {
    e.preventDefault();
    setBusy("subscription");
    try {
      await api("/api/subscriptions", { method: "POST", body: JSON.stringify(newSubscription) });
      toast.success(newSubscription.title + " added");
      setNewSubscription({ title: "", dueDate: "", amount: "" });
      subscriptionsQuery.mutate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function removeSubscription(s: SubscriptionDoc) {
    if (!confirm("Remove " + s.title + "?")) return;
    try {
      await api("/api/subscriptions/" + s._id, { method: "DELETE" });
      toast.success(s.title + " removed");
      subscriptionsQuery.mutate();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function backupNow() {
    setBusy("backup");
    try {
      await api("/api/backups", { method: "POST" });
      toast.success("Backup taken");
      backupsQuery.mutate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function restore(id: string, when: string) {
    if (
      !confirm(
        "Restore the backup from " +
          when +
          "?\n\nEverything now — accounts, budget and spending — is replaced by that snapshot. " +
          "The current data is backed up first, so this can be undone."
      )
    )
      return;
    setBusy("restore-" + id);
    try {
      await api("/api/backups/" + id, { method: "POST" });
      toast.success("Restored. The app is showing the older data now.");
      refreshAll();
      backupsQuery.mutate();
      usersQuery.mutate();
      settingsQuery.mutate();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function deleteBackup(id: string) {
    if (!confirm("Delete this backup?")) return;
    try {
      await api("/api/backups/" + id, { method: "DELETE" });
      backupsQuery.mutate();
      toast.success("Backup deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const seatsFull = users && settings ? users.length >= settings.teamSize : false;

  return (
    <div className="stagger space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Admin</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Only you can set the budget, manage accounts and restore backups.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget</CardTitle>
          <CardDescription>
            The total covers the services you buy. The monthly cap is what you expect
            infrastructure to cost each month. Team size is how many accounts may exist, yours
            included.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settingsQuery.error ? (
            <ErrorState
              message={(settingsQuery.error as Error).message}
              onRetry={() => settingsQuery.mutate()}
            />
          ) : !settings ? (
            <ListSkeleton rows={3} />
          ) : (
            <form onSubmit={saveBudget} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="projectName">Project name</Label>
                  <Input
                    id="projectName"
                    value={budgetForm.projectName}
                    onChange={(e) => setBudgetForm({ ...budgetForm, projectName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Select
                    value={budgetForm.currency}
                    onValueChange={(v) => setBudgetForm({ ...budgetForm, currency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR — ₹</SelectItem>
                      <SelectItem value="USD">USD — $</SelectItem>
                      <SelectItem value="EUR">EUR — €</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="totalBudget">Total budget</Label>
                  <Input
                    id="totalBudget"
                    inputMode="decimal"
                    value={budgetForm.totalBudget}
                    onChange={(e) => setBudgetForm({ ...budgetForm, totalBudget: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="text-primary text-xs font-semibold hover:underline"
                    onClick={() =>
                      setBudgetForm({ ...budgetForm, totalBudget: String(DEFAULT_BUDGET) })
                    }
                  >
                    Use the default {formatMoney(DEFAULT_BUDGET)}
                  </button>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monthlyInfraBudget">Monthly infrastructure cap</Label>
                  <Input
                    id="monthlyInfraBudget"
                    inputMode="decimal"
                    value={budgetForm.monthlyInfraBudget}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, monthlyInfraBudget: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="usdRate">Rupees per dollar</Label>
                  <Input
                    id="usdRate"
                    inputMode="decimal"
                    value={budgetForm.usdRate}
                    onChange={(e) => setBudgetForm({ ...budgetForm, usdRate: e.target.value })}
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Used when someone types an amount in dollars — plenty of the services bill
                    that way.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="teamSize">Team size (accounts allowed)</Label>
                  <Input
                    id="teamSize"
                    inputMode="numeric"
                    value={budgetForm.teamSize}
                    onChange={(e) => setBudgetForm({ ...budgetForm, teamSize: e.target.value })}
                    required
                  />
                  <p className="text-muted-foreground text-xs">
                    Members sign themselves up at /signup until the seats run out.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="roadmapPercent">Overall completion override</Label>
                  <Input
                    id="roadmapPercent"
                    inputMode="numeric"
                    placeholder="Auto"
                    value={budgetForm.roadmapPercent}
                    onChange={(e) =>
                      setBudgetForm({ ...budgetForm, roadmapPercent: e.target.value })
                    }
                  />
                  <p className="text-muted-foreground text-xs">
                    Shown on the Progress page. Leave blank to calculate it from stage status
                    below.
                  </p>
                </div>
              </div>
              <Button type="submit" disabled={busy === "budget"}>
                {busy === "budget" ? "Saving…" : "Save budget"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4" /> Upcoming subscriptions
          </CardTitle>
          <CardDescription>
            Renewals coming up — a reminder shows on every page starting {WINDOW_DAYS} days out,
            so there is time to have the payment ready.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionsQuery.error ? (
            <ErrorState
              message={(subscriptionsQuery.error as Error).message}
              onRetry={() => subscriptionsQuery.mutate()}
            />
          ) : !subscriptions ? (
            <ListSkeleton rows={2} />
          ) : subscriptions.length === 0 ? (
            <EmptyState
              title="Nothing tracked yet"
              hint="Add a domain, hosting or Play Console renewal below."
              icon={CalendarClock}
            />
          ) : (
            <ul className="divide-y">
              {subscriptions.map((s) => {
                const days = daysUntil(s.dueDate);
                return (
                  <li key={s._id} className="flex items-center gap-2 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-muted-foreground text-xs">
                        {s.dueDate}
                        {s.amount ? " · " + formatMoney(s.amount, settings?.currency) : ""}
                      </p>
                    </div>
                    <Badge variant={days < 0 ? "destructive" : days <= 7 ? "warning" : "secondary"}>
                      {days < 0
                        ? Math.abs(days) + "d overdue"
                        : days === 0
                          ? "today"
                          : "in " + days + "d"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive size-9"
                      onClick={() => removeSubscription(s)}
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}

          <Separator />

          <form onSubmit={addSubscription} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="subTitle">Title</Label>
                <Input
                  id="subTitle"
                  value={newSubscription.title}
                  onChange={(e) => setNewSubscription({ ...newSubscription, title: e.target.value })}
                  placeholder="Domain renewal"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subDueDate">Due date</Label>
                <Input
                  id="subDueDate"
                  type="date"
                  min={todayISO()}
                  value={newSubscription.dueDate}
                  onChange={(e) =>
                    setNewSubscription({ ...newSubscription, dueDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subAmount">Amount (optional)</Label>
                <Input
                  id="subAmount"
                  inputMode="decimal"
                  value={newSubscription.amount}
                  onChange={(e) =>
                    setNewSubscription({ ...newSubscription, amount: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={busy === "subscription"}>
              {busy === "subscription" ? "Adding…" : "Add subscription"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project status</CardTitle>
          <CardDescription>
            What everyone sees on the Progress page. Set where each stage stands — this is not the
            team&apos;s task list, just the status an investor would want to see.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stagesQuery.error ? (
            <ErrorState
              message={(stagesQuery.error as Error).message}
              onRetry={() => stagesQuery.mutate()}
            />
          ) : !stages ? (
            <ListSkeleton rows={4} />
          ) : (
            <ul className="divide-y">
              {stages.map((stage) => (
                <li key={stage._id} className="space-y-2 py-3 first:pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{stage.name}</p>
                      <p className="text-muted-foreground truncate text-xs">{stage.summary}</p>
                    </div>
                    <Select
                      value={stage.status}
                      onValueChange={(v) => setStageStatus(stage, v as StageStatus)}
                    >
                      <SelectTrigger size="sm" className="w-[9.5rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGE_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STAGE_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {stage.status === "blocked" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Why it's blocked"
                        value={noteDrafts[stage._id] ?? stage.note}
                        onChange={(e) =>
                          setNoteDrafts({ ...noteDrafts, [stage._id]: e.target.value })
                        }
                      />
                      <Button variant="outline" size="sm" onClick={() => saveStageNote(stage)}>
                        Save
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Team</CardTitle>
            <CardDescription>
              Members can sign up themselves; you can also add them here.
            </CardDescription>
          </div>
          {users && settings ? (
            <Badge variant={seatsFull ? "warning" : "secondary"}>
              {users.length} / {settings.teamSize}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {usersQuery.error ? (
            <ErrorState
              message={(usersQuery.error as Error).message}
              onRetry={() => usersQuery.mutate()}
            />
          ) : !users ? (
            <ListSkeleton rows={3} />
          ) : (
            <ul className="divide-y">
              {users.map((u) => (
                <li key={u._id} className="flex flex-wrap items-center gap-2 py-3 first:pt-0">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{u.name}</span>
                      {u._id === meId ? <Badge variant="outline">you</Badge> : null}
                      {!u.active ? <Badge variant="secondary">disabled</Badge> : null}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">{u.email}</p>
                  </div>

                  <Select
                    value={u.role}
                    disabled={u._id === meId}
                    onValueChange={(v) =>
                      patchUser(u._id, { role: v }, u.name + " is now " + ROLE_LABELS[v as Role])
                    }
                  >
                    <SelectTrigger size="sm" className="w-[8.5rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-9"
                      onClick={() => resetPassword(u)}
                      aria-label="Reset password"
                      title="Reset password"
                    >
                      <KeyRound className="size-4" />
                    </Button>
                    {u._id === meId ? null : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            patchUser(
                              u._id,
                              { active: !u.active },
                              u.name + (u.active ? " was disabled" : " was re-enabled")
                            )
                          }
                        >
                          {u.active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive size-9"
                          onClick={() => removeUser(u)}
                          aria-label="Remove"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Separator />

          <form onSubmit={addUser} className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <UserPlus className="size-4" /> Add a member
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="memberName">Name</Label>
                <Input
                  id="memberName"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="memberEmail">Email</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="priya@example.com"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(v) => setNewUser({ ...newUser, role: v as Role })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="memberPassword">Temporary password</Label>
                <Input
                  id="memberPassword"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="At least 8 characters"
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={busy === "user" || seatsFull}>
              {seatsFull ? "No seats left" : busy === "user" ? "Adding…" : "Add member"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <DatabaseBackup className="size-4" /> Backups
            </CardTitle>
            <CardDescription>
              A full copy of the accounts, budget and spending, kept inside the database.
              One is taken automatically at most once an hour when something changes. The newest 20
              are kept.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={backupNow} disabled={busy === "backup"}>
            {busy === "backup" ? "Saving…" : "Back up now"}
          </Button>
        </CardHeader>
        <CardContent>
          {backupsQuery.error ? (
            <ErrorState
              message={(backupsQuery.error as Error).message}
              onRetry={() => backupsQuery.mutate()}
            />
          ) : !backups ? (
            <ListSkeleton rows={2} />
          ) : backups.length === 0 ? (
            <EmptyState
              title="No backups yet"
              hint="One is taken the first time data changes, or take one now."
              icon={DatabaseBackup}
            />
          ) : (
            <ul className="divide-y">
              {backups.map((b) => {
                const when = new Date(b.createdAt).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <li key={b._id} className="flex flex-wrap items-center gap-2 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        {when}
                        <Badge variant={b.reason === "manual" ? "secondary" : "outline"}>
                          {b.reason}
                        </Badge>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {b.counts.users} accounts · {b.counts.expenses} spending entries · by{" "}
                        {b.createdBy}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="size-9" asChild title="Download">
                        <a href={"/api/backups/" + b._id} download>
                          <Download className="size-4" />
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restore(b._id, when)}
                        disabled={busy === "restore-" + b._id}
                      >
                        <RotateCcw className="size-4" />
                        {busy === "restore-" + b._id ? "Restoring…" : "Restore"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive size-9"
                        onClick={() => deleteBackup(b._id)}
                        aria-label="Delete backup"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground flex items-center gap-2 pb-2 text-xs">
        <Users className="size-3.5" />
        Members can add and edit spending but never reach this page.
      </p>
    </div>
  );
}
