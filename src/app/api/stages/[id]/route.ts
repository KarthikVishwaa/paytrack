import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import { afterWrite, handle, HttpError, parseOneOf, parseText, requireAdmin } from "@/lib/api";
import { STAGE_STATUS_DEFAULT_PERCENT, STAGE_STATUSES, type StageDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function parsePercent(input: unknown): number {
  const n = typeof input === "number" ? input : Number(String(input).trim());
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new HttpError(400, "Percent must be between 0 and 100.");
  }
  return Math.round(n);
}

/** Only the admin marks stage status and progress — everyone else just views the Progress page. */
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

  // An explicit percent always wins. Otherwise, switching status jumps to
  // that status's usual figure; picking the same status again leaves it —
  // older stage rows that predate this field fall back the same way.
  const currentPercent = row.percent ?? STAGE_STATUS_DEFAULT_PERCENT[row.status];
  const percent =
    body.percent !== undefined
      ? parsePercent(body.percent)
      : status !== row.status
        ? STAGE_STATUS_DEFAULT_PERCENT[status]
        : currentPercent;

  const update = {
    status,
    percent,
    note,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.name,
  };

  await stages.updateOne({ _id: id as never }, { $set: update });
  await afterWrite(admin.name);
  return NextResponse.json({ stage: { ...row, ...update } });
});
