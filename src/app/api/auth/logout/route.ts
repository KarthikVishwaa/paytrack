import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { clearSessionCookie } from "@/lib/session";

export const POST = handle(async () => {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
});
