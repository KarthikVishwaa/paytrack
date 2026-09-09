import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import { afterWrite, handle, HttpError, parseOneOf, parseText, requireAdmin } from "@/lib/api";
import { STAGE_STATUSES, type StageDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Only the admin marks stage status — everyone else just views the Progress page. */
export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json();

  const { stages } = await collections();
  const row = (await stages.findOne({ _id: id as never })) as StageDoc | null;
  if (!row) throw new HttpError(404, "That stage no longer exists.");

  const status = body.status !== undefined ? parseOneOf(body.status, STAGE_STATUSES, "status") : row.status;
  const noteInput = body.note !== undefined ? parseText(body.note, "Note", 140, false) : row.note;
  // The note only means anything while the stage is blocked.
  const note = status === "blocked" ? noteInput : "";

  const update = {
    status,
    note,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.name,
  };

  await stages.updateOne({ _id: id as never }, { $set: update });
  await afterWrite(admin.name);
  return NextResponse.json({ stage: { ...row, ...update } });
});
