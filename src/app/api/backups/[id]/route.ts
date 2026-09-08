import { NextResponse } from "next/server";
import { deleteBackup, getBackup, restoreBackup } from "@/lib/backup";
import { handle, HttpError, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Downloads one snapshot as JSON, so a copy can be kept outside the database too. */
export const GET = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const backup = await getBackup(id);
  if (!backup) throw new HttpError(404, "That backup no longer exists.");

  // Password hashes stay in the database copy but never leave it in a download.
  const safe = {
    ...backup,
    data: {
      ...backup.data,
      users: backup.data.users.map(({ passwordHash: _hash, ...rest }) => rest),
    },
  };

  return new NextResponse(JSON.stringify(safe, null, 2), {
    headers: {
      "content-type": "application/json",
      "content-disposition": 'attachment; filename="paytrack-backup-' + id + '.json"',
    },
  });
});

/** Puts this snapshot back. The data being replaced is backed up first. */
export const POST = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const counts = await restoreBackup(id, admin.name);
  return NextResponse.json({ ok: true, counts });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  await requireAdmin();
  const { id } = await ctx.params;
  await deleteBackup(id);
  return NextResponse.json({ ok: true });
});
