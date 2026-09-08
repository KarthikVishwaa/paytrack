import { NextResponse } from "next/server";
import { buildSummary } from "@/lib/data";
import { handle, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireUser();
  return NextResponse.json(await buildSummary());
});
