import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import { getReminders } from "@/lib/data";
import {
  afterWrite,
  handle,
  HttpError,
  parseAmount,
  parseText,
  requireAdmin,
  requireUser,
} from "@/lib/api";
import type { ReminderDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

/** An optional YYYY-MM-DD — blank means no target date was set. */
function parseOptionalDate(input: unknown): string {
  const value = String(input ?? "").trim();
  if (!value) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00`).getTime())) {
    throw new HttpError(400, "Enter a valid date.");
  }
  return value;
}

export const GET = handle(async () => {
  await requireUser();
  return NextResponse.json({ reminders: await getReminders() });
});

/** Only the admin posts a reminder — everyone else just sees it until it's closed. */
export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const body = await req.json();

  const doc: ReminderDoc = {
    _id: crypto.randomUUID(),
    message: parseText(body.message, "Message", 200),
    amount: body.amount === undefined || body.amount === "" ? 0 : parseAmount(body.amount),
    dueDate: parseOptionalDate(body.dueDate),
    createdAt: new Date().toISOString(),
    createdBy: admin.name,
  };

  const { reminders } = await collections();
  await reminders.insertOne(doc as never);
  await afterWrite(admin.name);
  return NextResponse.json({ reminder: doc }, { status: 201 });
});
