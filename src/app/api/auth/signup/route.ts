import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collections } from "@/lib/mongodb";
import { getSettings } from "@/lib/data";
import { afterWrite, handle, HttpError, parseOneOf, parseText } from "@/lib/api";
import { setSessionCookie } from "@/lib/session";
import { MEMBER_ROLES, type UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Tells the sign-up page whether there is still a free seat on the team. */
export const GET = handle(async () => {
  const { users } = await collections();
  const [settings, taken] = await Promise.all([getSettings(), users.countDocuments({})]);
  return NextResponse.json({
    open: taken > 0 && taken < settings.teamSize,
    started: taken > 0,
    taken,
    teamSize: settings.teamSize,
  });
});

/**
 * Team members create their own account, up to the team size the admin has set.
 * Nobody can make themselves an admin here — that role only comes from the admin.
 */
export const POST = handle(async (req: Request) => {
  const { users } = await collections();
  const [settings, taken] = await Promise.all([getSettings(), users.countDocuments({})]);

  if (taken === 0) {
    throw new HttpError(403, "The admin account has to be created first.");
  }
  if (taken >= settings.teamSize) {
    throw new HttpError(
      403,
      "The team is full (" + settings.teamSize + " accounts). Ask the admin to make room."
    );
  }

  const body = await req.json();
  const name = parseText(body.name, "Name", 80);
  const email = parseText(body.email, "Email", 120).toLowerCase();
  const role = parseOneOf(body.role, MEMBER_ROLES, "role");
  const password = String(body.password ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, "Enter a valid email.");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
  if (await users.findOne({ email })) throw new HttpError(409, "That email already has an account.");

  const doc: UserDoc = {
    _id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role,
    active: true,
    createdAt: new Date().toISOString(),
  };
  await users.insertOne(doc as never);
  await afterWrite(doc.name);

  await setSessionCookie({ id: doc._id, name: doc.name, email: doc.email, role: doc.role });
  return NextResponse.json({ ok: true }, { status: 201 });
});
