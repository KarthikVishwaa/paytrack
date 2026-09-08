import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { collections } from "@/lib/mongodb";
import { handle, HttpError, parseText } from "@/lib/api";
import { setSessionCookie } from "@/lib/session";

import type { UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = handle(async (req: Request) => {
  const body = await req.json();

  const email = parseText(body.email, "Email", 120).toLowerCase();

  const password = String(body.password ?? "");

  const { users } = await collections();

  const user = (await users.findOne({
    email,
  })) as UserDoc | null;

  // Use the same error message whether the email exists or not.
  // This prevents the login form from leaking registered emails.
  const invalid = new HttpError(
    401,
    "Wrong email or password."
  );

  if (!user) {
    // Perform a bcrypt comparison even when the user doesn't exist.
    // This keeps response timing more consistent.
    await bcrypt.compare(
      password,
      "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv"
    );

    throw invalid;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    throw invalid;
  }

  if (!user.active) {
    throw new HttpError(
      403,
      "This account has been disabled."
    );
  }

  await setSessionCookie({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return NextResponse.json({
    ok: true,
  });
});