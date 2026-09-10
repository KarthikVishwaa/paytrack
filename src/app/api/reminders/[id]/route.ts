import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import { afterWrite, handle, HttpError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;

  const { reminders } = await collections();
  const result = await reminders.deleteOne({ _id: id as never });
  if (result.deletedCount === 0) throw new HttpError(404, "That reminder no longer exists.");

  await afterWrite(admin.name);
  return NextResponse.json({ ok: true });
});
