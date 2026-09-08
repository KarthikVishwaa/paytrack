import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { activeUser } from "@/lib/data";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  return NextResponse.json({ user: await activeUser() });
});
