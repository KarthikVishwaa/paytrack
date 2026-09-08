import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import {
  afterWrite,
  amountInProjectCurrency,
  handle,
  parseDate,
  parseOneOf,
  parseText,
  requireUser,
} from "@/lib/api";
import { EXPENSE_CATEGORIES, type ExpenseDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireUser();
  const { expenses } = await collections();
  const rows = await expenses.find({}).sort({ date: -1, createdAt: -1 }).limit(500).toArray();
  return NextResponse.json({ expenses: rows });
});

export const POST = handle(async (req: Request) => {
  const user = await requireUser();
  const body = await req.json();
  const money = await amountInProjectCurrency(body);

  const doc: ExpenseDoc = {
    _id: crypto.randomUUID(),
    title: parseText(body.title, "Description", 140),
    ...money,
    category: parseOneOf(body.category, EXPENSE_CATEGORIES, "category"),
    billing: parseOneOf(body.billing, ["once", "monthly"] as const, "billing type"),
    vendor: parseText(body.vendor, "Vendor", 100, false),
    date: parseDate(body.date),
    notes: parseText(body.notes, "Notes", 500, false),
    createdBy: user.id,
    createdByName: user.name,
    createdAt: new Date().toISOString(),
  };

  const { expenses } = await collections();
  await expenses.insertOne(doc as never);
  await afterWrite(user.name);
  return NextResponse.json({ expense: doc }, { status: 201 });
});
