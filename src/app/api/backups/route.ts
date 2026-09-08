import { NextResponse } from "next/server";
import { createBackup, listBackups } from "@/lib/backup";
import { handle, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin();
  return NextResponse.json({ backups: await listBackups() });
});

/** Take a snapshot right now. */
export const POST = handle(async () => {
  const admin = await requireAdmin();
  const backup = await createBackup(admin.name, "manual");
  return NextResponse.json({ backup }, { status: 201 });
});
