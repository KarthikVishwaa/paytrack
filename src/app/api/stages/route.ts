import { NextResponse } from "next/server";
import { handle, requireUser } from "@/lib/api";
import { getStages } from "@/lib/data";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireUser();
  return NextResponse.json({ stages: await getStages() });
});
