import { NextResponse } from "next/server";

import bcrypt from "bcryptjs";

import { collections } from "@/lib/mongodb";
import { handle, HttpError, parseText } from "@/lib/api";
import { setSessionCookie } from "@/lib/session";
import { clearFailedLogins, loginBlockedFor, recordFailedLogin } from "@/lib/rate-limit";

import type { UserDoc } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tooManyAttempts(seconds: number): HttpError {
  const minutes = Math.ceil(seconds / 60);
  return new HttpError(
    429,
    `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`
  );
}

export const POST = handle(async (req: Request) => {
  const body = await req.json();

  const email = parseText(body.email, "Email", 120).toLowerCase();

  const password = String(body.password ?? "");

  // Checked before touching the database or bcrypt at all, so a lockout
  // costs the caller nothing extra to find out about.
  const blockedFor = await loginBlockedFor(email);
  if (blockedFor > 0) throw tooManyAttempts(blockedFor);

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

    const wait = await recordFailedLogin(email);
    throw wait > 0 ? tooManyAttempts(wait) : invalid;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    const wait = await recordFailedLogin(email);
    throw wait > 0 ? tooManyAttempts(wait) : invalid;
  }

  if (!user.active) {
    throw new HttpError(
      403,
      "This account has been disabled."
    );
  }

  await clearFailedLogins(email);

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
