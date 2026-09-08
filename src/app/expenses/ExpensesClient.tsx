"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/money-ui";
import { api, refreshAll, useExpenses, useSettings } from "@/lib/client";
import { cn } from "@/lib/utils";
import { formatDate, formatMoney, todayISO } from "@/lib/money";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  type Billing,
  type EntryCurrency,
  type ExpenseCategory,
  type ExpenseDoc,
  type SessionUser,
} from "@/lib/types";

interface FormState {
  title: string;
  amount: string;
  enteredCurrency: EntryCurrency;
  category: ExpenseCategory;
  billing: Billing;
  vendor: string;
  date: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  title: "",
  amount: "",
  enteredCurrency: "INR",
  category: "service",
  billing: "once",
  vendor: "",
  date: todayISO(),
  notes: "",
});

export default function ExpensesClient({ user }: { user: SessionUser }) {
  const { data, error, isLoading, mutate } = useExpenses();
  const rows = useMemo(() => data?.expenses ?? [], [data]);
  const usdRate = useSettings().data?.settings.usdRate ?? 88;

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ExpenseCategory>("all");
  const [busy, setBusy] = useState(false);

  const visible = useMemo(
    () => rows.filter((r) => filter === "all" || r.category === filter),
    [rows, filter]
  );
  const visibleTotal = visible.reduce((sum, r) => sum + r.amount, 0);
  const monthlyTotal = visible
    .filter((r) => r.billing === "monthly")
    .reduce((sum, r) => sum + r.amount, 0);

  const canEdit = (row: ExpenseDoc) => user.role === "admin" || row.createdBy === user.id;

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function startEdit(row: ExpenseDoc) {
    setEditingId(row._id);
    setForm({
      title: row.title,
      amount: String(row.enteredAmount ?? row.amount),
      enteredCurrency: row.enteredCurrency ?? "INR",
      category: row.category,
      billing: row.billing,
      vendor: row.vendor,
      date: row.date,
      notes: row.notes,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);

    const amount = Number(form.amount.replace(/,/g, ""));
    // Show the change straight away, then confirm it with the server.
    const typed = Number.isFinite(amount) ? amount : 0;
    const draft: ExpenseDoc = {
      _id: editingId ?? "optimistic-" + Date.now(),
      title: form.title,
      amount: form.enteredCurrency === "USD" ? typed * usdRate : typed,
      enteredAmount: typed,
      enteredCurrency: form.enteredCurrency,
      category: form.category,
      billing: form.billing,
      vendor: form.vendor,
      date: form.date,
      notes: form.notes,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
    };
    const optimistic = editingId
      ? rows.map((r) => (r._id === editingId ? { ...r, ...draft } : r))
      : [draft, ...rows];

    setOpen(false);

    try {
      await mutate(
        async () => {
          await api(editingId ? "/api/expenses/" + editingId : "/api/expenses", {
            method: editingId ? "PATCH" : "POST",
            body: JSON.stringify(form),
          });
          return api<{ expenses: ExpenseDoc[] }>("/api/expenses");
        },
        { optimisticData: { expenses: optimistic }, rollbackOnError: true, revalidate: false }
      );
      toast.success(editingId ? "Entry updated" : "Spending added");
      setForm(emptyForm());
      setEditingId(null);
      refreshAll();
    } catch (err) {
      toast.error((err as Error).message);
      setOpen(true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(row: ExpenseDoc) {
    if (!confirm('Delete "' + row.title + '"?')) return;
    try {
      await mutate(
        async () => {
          await api("/api/expenses/" + row._id, { method: "DELETE" });
          return api<{ expenses: ExpenseDoc[] }>("/api/expenses");
        },
        {
          optimisticData: { expenses: rows.filter((r) => r._id !== row._id) },
          rollbackOnError: true,
          revalidate: false,
        }
      );
      toast.success("Entry deleted");
      refreshAll();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="stagger space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Spending</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Services, monthly infrastructure, tools — everything the project pays for.
          </p>
        </div>
        <Button onClick={startAdd} className="hidden sm:inline-flex">
          <Plus /> Add
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-1 py-3">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Total shown
            </p>
            <p className="tabular mt-1 text-lg font-bold">{formatMoney(visibleTotal)}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-3">
          <CardContent className="px-4">
            <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Every month
            </p>
            <p className="tabular mt-1 text-lg font-bold">{formatMoney(monthlyTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">
            All spending
            <span className="text-muted-foreground ml-2 text-sm font-normal">{visible.length}</span>
          </CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as "all" | ExpenseCategory)}>
            <SelectTrigger size="sm" className="w-[9.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent>
          {error ? (
            <ErrorState message={(error as Error).message} onRetry={() => mutate()} />
          ) : isLoading ? (
            <ListSkeleton />
          ) : visible.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              hint="Tap Add to log the first payment."
              icon={Wallet}
            />
          ) : (
            <>
              {/* Phones get cards — a table would need side-scrolling. */}
              <ul className="divide-y md:hidden">
                {visible.map((row) => (
                  <li key={row._id} className="flex items-start gap-3 py-3 first:pt-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.title}</p>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {formatDate(row.date)}
                        {row.vendor ? " · " + row.vendor : ""} · {row.createdByName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: CATEGORY_COLORS[row.category],
                            background: "color-mix(in oklab, " + CATEGORY_COLORS[row.category] + " 14%, transparent)",
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: CATEGORY_COLORS[row.category] }}
                          />
                          {CATEGORY_LABELS[row.category] ?? row.category}
                        </span>
                        {row.billing === "monthly" ? (
                          <Badge variant="warning">monthly</Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="tabular text-sm font-semibold">
                        {formatMoney(row.amount)}
                      </span>
                      {row.enteredCurrency === "USD" ? (
                        <span className="text-muted-foreground tabular text-[11px]">
                          ${row.enteredAmount} typed
                        </span>
                      ) : null}
                      {canEdit(row) ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => startEdit(row)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive size-8"
                            onClick={() => remove(row)}
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>What</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Added by</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>
                          <p className="font-medium">{row.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {row.vendor || "—"}
                            {row.notes ? " · " + row.notes : ""}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <span
                          className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                          style={{
                            color: CATEGORY_COLORS[row.category],
                            background: "color-mix(in oklab, " + CATEGORY_COLORS[row.category] + " 14%, transparent)",
                          }}
                        >
                          <span
                            className="size-1.5 rounded-full"
                            style={{ background: CATEGORY_COLORS[row.category] }}
                          />
                          {CATEGORY_LABELS[row.category] ?? row.category}
                        </span>
                            {row.billing === "monthly" ? (
                              <Badge variant="warning">monthly</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDate(row.date)}</TableCell>
                        <TableCell className="whitespace-nowrap">{row.createdByName}</TableCell>
                        <TableCell className="tabular text-right font-semibold whitespace-nowrap">
                          {formatMoney(row.amount)}
                          {row.enteredCurrency === "USD" ? (
                            <span className="text-muted-foreground block text-[11px] font-normal">
                              ${row.enteredAmount} typed
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {canEdit(row) ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => startEdit(row)}
                                aria-label="Edit"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive size-8"
                                onClick={() => remove(row)}
                                aria-label="Delete"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Thumb-reachable add button on phones. */}
      <Button
        onClick={startAdd}
        size="lg"
        className="fixed right-4 bottom-20 z-20 size-14 rounded-full p-0 shadow-lg sm:hidden"
        aria-label="Add spending"
      >
        <Plus className="size-6" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit spending" : "Add spending"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update this entry." : "Log something the project paid for."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">What was it for</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Play Store developer account"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <div className="flex gap-1.5">
                  {/* Plenty of the services bill in dollars, so either can be typed. */}
                  <div className="bg-secondary flex shrink-0 rounded-lg p-0.5">
                    {(["INR", "USD"] as const).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setForm({ ...form, enteredCurrency: code })}
                        aria-pressed={form.enteredCurrency === code}
                        className={cn(
                          "w-8 rounded-md text-sm font-semibold transition-all duration-200",
                          form.enteredCurrency === code
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground"
                        )}
                      >
                        {code === "INR" ? "₹" : "$"}
                      </button>
                    ))}
                  </div>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder={form.enteredCurrency === "USD" ? "29" : "2500"}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as ExpenseCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>How often</Label>
                <Select
                  value={form.billing}
                  onValueChange={(v) => setForm({ ...form, billing: v as Billing })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One time</SelectItem>
                    <SelectItem value="monthly">Every month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.enteredCurrency === "USD" && Number(form.amount.replace(/,/g, "")) > 0 ? (
              <p className="text-muted-foreground text-xs">
                About {formatMoney(Number(form.amount.replace(/,/g, "")) * usdRate)} at ₹{usdRate}
                {" "}to the dollar. The budget is tracked in rupees.
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="vendor">Paid to (optional)</Label>
              <Input
                id="vendor"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="AWS, Google, Figma…"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Invoice number, who approved it…"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" disabled={busy}>
                {editingId ? "Save changes" : "Add spending"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
