import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collections } from "@/lib/mongodb";
import { afterWrite, handle, HttpError, parseText } from "@/lib/api";
import { setSessionCookie } from "@/lib/session";
import type { UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Tells the login page whether the very first admin still has to be created. */
export const GET = handle(async () => {
  const { users } = await collections();
  const count = await users.countDocuments({}, { limit: 1 });
  return NextResponse.json({ needsSetup: count === 0 });
});

/** One-time: creates the first admin account. Refuses once any user exists. */
export const POST = handle(async (req: Request) => {
  const { users } = await collections();
  if ((await users.countDocuments({}, { limit: 1 })) > 0) {
    throw new HttpError(403, "Setup is already done. Please sign in.");
  }

  const body = await req.json();
  const name = parseText(body.name, "Name", 80);
  const email = parseText(body.email, "Email", 120).toLowerCase();
  const password = String(body.password ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, "Enter a valid email.");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");

  const doc: UserDoc = {
    _id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role: "admin",
    active: true,
    createdAt: new Date().toISOString(),
  };
  await users.insertOne(doc as never);
  await afterWrite(doc.name);
  await setSessionCookie({ id: doc._id, name: doc.name, email: doc.email, role: doc.role });
  return NextResponse.json({ ok: true });
});
