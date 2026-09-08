import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collections } from "@/lib/mongodb";
import { handle, HttpError, parseText } from "@/lib/api";
import { setSessionCookie } from "@/lib/session";
import type { UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export const POST = handle(async (req: Request) => {
  const body = await req.json();
  const email = parseText(body.email, "Email", 120).toLowerCase();
  const password = String(body.password ?? "");

  const { users } = await collections();
  const user = (await users.findOne({ email })) as UserDoc | null;
  // Same message either way so the form never leaks which emails exist.
  const invalid = new HttpError(401, "Wrong email or password.");
  if (!user) {
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    throw invalid;
  }
  if (!(await bcrypt.compare(password, user.passwordHash))) throw invalid;
  if (!user.active) throw new HttpError(403, "This account has been disabled.");

  await setSessionCookie({ id: user._id, name: user.name, email: user.email, role: user.role });
  return NextResponse.json({ ok: true });
});
