import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { collections } from "@/lib/mongodb";
import { afterWrite, handle, HttpError, parseOneOf, parseText, requireAdmin } from "@/lib/api";
import { ROLES, type UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json();

  const { users } = await collections();
  const row = (await users.findOne({ _id: id as never })) as UserDoc | null;
  if (!row) throw new HttpError(404, "That member no longer exists.");

  const update: Partial<UserDoc> = {};
  if (body.name !== undefined) update.name = parseText(body.name, "Name", 80);
  if (body.role !== undefined) update.role = parseOneOf(body.role, ROLES, "role");
  if (body.active !== undefined) update.active = Boolean(body.active);
  if (body.password) {
    const password = String(body.password);
    if (password.length < 8) throw new HttpError(400, "Password must be at least 8 characters.");
    update.passwordHash = await bcrypt.hash(password, 10);
  }

  // Never let the last admin lock everyone out of the budget settings.
  const losingAdmin =
    row.role === "admin" && (update.role !== undefined ? update.role !== "admin" : false);
  if ((losingAdmin || update.active === false) && row.role === "admin") {
    const admins = await users.countDocuments({ role: "admin", active: true });
    if (admins <= 1) throw new HttpError(400, "There must always be one active admin.");
  }
  if (row._id === admin.id && update.active === false) {
    throw new HttpError(400, "You cannot disable your own account.");
  }

  await users.updateOne({ _id: id as never }, { $set: update });
  await afterWrite(admin.name);
  return NextResponse.json({ ok: true });
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  if (id === admin.id) throw new HttpError(400, "You cannot delete your own account.");

  const { users } = await collections();
  const row = (await users.findOne({ _id: id as never })) as UserDoc | null;
  if (!row) throw new HttpError(404, "That member no longer exists.");
  if (row.role === "admin") {
    const admins = await users.countDocuments({ role: "admin" });
    if (admins <= 1) throw new HttpError(400, "There must always be one admin.");
  }

  await users.deleteOne({ _id: id as never });
  await afterWrite(admin.name);
  return NextResponse.json({ ok: true });
});
