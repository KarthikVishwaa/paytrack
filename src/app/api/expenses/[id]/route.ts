import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import {
  afterWrite,
  amountInProjectCurrency,
  handle,
  HttpError,
  parseDate,
  parseOneOf,
  parseText,
  requireUser,
} from "@/lib/api";
import { EXPENSE_CATEGORIES, type ExpenseDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Admins can touch any row; everyone else only their own. */
async function loadOwned(id: string) {
  const user = await requireUser();
  const { expenses } = await collections();
  const row = (await expenses.findOne({ _id: id as never })) as ExpenseDoc | null;
  if (!row) throw new HttpError(404, "That expense no longer exists.");
  if (user.role !== "admin" && row.createdBy !== user.id) {
    throw new HttpError(403, "You can only change entries you added.");
  }
  return { expenses, row };
}

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { expenses, row } = await loadOwned(id);
  const body = await req.json();

  const money = await amountInProjectCurrency({
    amount: body.amount ?? row.enteredAmount ?? row.amount,
    enteredCurrency: body.enteredCurrency ?? row.enteredCurrency ?? "INR",
  });

  const update = {
    title: parseText(body.title ?? row.title, "Description", 140),
    ...money,
    category: parseOneOf(body.category ?? row.category, EXPENSE_CATEGORIES, "category"),
    billing: parseOneOf(body.billing ?? row.billing, ["once", "monthly"] as const, "billing type"),
    vendor: parseText(body.vendor ?? row.vendor, "Vendor", 100, false),
    date: parseDate(body.date ?? row.date),
    notes: parseText(body.notes ?? row.notes, "Notes", 500, false),
  };
  await expenses.updateOne({ _id: id as never }, { $set: update });
  await afterWrite(row.createdByName);
  return NextResponse.json({ expense: { ...row, ...update } });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const { expenses, row } = await loadOwned(id);
  await expenses.deleteOne({ _id: id as never });
  await afterWrite(row.createdByName);
  return NextResponse.json({ ok: true });
});
