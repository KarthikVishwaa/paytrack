import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collections } from "@/lib/mongodb";
import { getSettings } from "@/lib/data";
import { afterWrite, handle, HttpError, parseOneOf, parseText, requireAdmin } from "@/lib/api";
import { ROLES, type UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  await requireAdmin();
  const { users } = await collections();
  const rows = (await users
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray()) as unknown as Omit<UserDoc, "passwordHash">[];
  return NextResponse.json({ users: rows });
});

/** Admin creates the team members and hands them their password. */
export const POST = handle(async (req: Request) => {
  await requireAdmin();
  const body = await req.json();

  const name = parseText(body.name, "Name", 80);
  const email = parseText(body.email, "Email", 120).toLowerCase();
  const role = parseOneOf(body.role, ROLES, "role");
  const password = String(body.password ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, "Enter a valid email.");
  if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");

  const { users } = await collections();
  if (await users.findOne({ email })) throw new HttpError(409, "That email is already used.");

  const [settings, taken] = await Promise.all([getSettings(), users.countDocuments({})]);
  if (taken >= settings.teamSize) {
    throw new HttpError(
      403,
      "The team is full (" + settings.teamSize + " accounts). Raise the team size or remove someone first."
    );
  }

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

  const { passwordHash: _hash, ...safe } = doc;
  return NextResponse.json({ user: safe }, { status: 201 });
});
