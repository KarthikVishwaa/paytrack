import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import { afterWrite, handle, HttpError, parseAmount, parseDate, parseText, requireAdmin } from "@/lib/api";
import type { SubscriptionDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json();

  const { subscriptions } = await collections();
  const row = (await subscriptions.findOne({ _id: id as never })) as SubscriptionDoc | null;
  if (!row) throw new HttpError(404, "That subscription no longer exists.");

  const update = {
    title: parseText(body.title ?? row.title, "Title", 100),
    dueDate: parseDate(body.dueDate ?? row.dueDate),
    amount: body.amount === undefined ? row.amount : parseAmount(body.amount),
    updatedAt: new Date().toISOString(),
    updatedBy: admin.name,
  };

  await subscriptions.updateOne({ _id: id as never }, { $set: update });
  await afterWrite(admin.name);
  return NextResponse.json({ subscription: { ...row, ...update } });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const { subscriptions } = await collections();
  const result = await subscriptions.deleteOne({ _id: id as never });
  if (result.deletedCount === 0) throw new HttpError(404, "That subscription no longer exists.");

  await afterWrite(admin.name);
  return NextResponse.json({ ok: true });
});
