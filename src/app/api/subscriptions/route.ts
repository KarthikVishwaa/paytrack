import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import { getSubscriptions } from "@/lib/data";
import { afterWrite, handle, parseAmount, parseDate, parseText, requireAdmin, requireUser } from "@/lib/api";
import type { SubscriptionDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireUser();
  return NextResponse.json({ subscriptions: await getSubscriptions() });
});

/** Only the admin tracks renewals — everyone else just sees the reminder. */
export const POST = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const body = await req.json();

  const doc: SubscriptionDoc = {
    _id: crypto.randomUUID(),
    title: parseText(body.title, "Title", 100),
    dueDate: parseDate(body.dueDate),
    amount: body.amount === undefined || body.amount === "" ? 0 : parseAmount(body.amount),
    createdAt: new Date().toISOString(),
    createdBy: admin.name,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.name,
  };

  const { subscriptions } = await collections();
  await subscriptions.insertOne(doc as never);
  await afterWrite(admin.name);
  return NextResponse.json({ subscription: doc }, { status: 201 });
});
