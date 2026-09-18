import { cookies } from "next/headers";

import type { SessionUser } from "./types";
import { COOKIE_NAME, MAX_AGE, getSecret, signToken, verifyToken } from "./jwt";

export { COOKIE_NAME };

function requireSecret(): Uint8Array {
  const secret = getSecret();
  if (!secret) {
    throw new Error("AUTH_SECRET is missing or too short. It must be at least 16 characters.");
  }
  return secret;
}

export async function signSession(user: SessionUser): Promise<string> {
  return signToken(user, requireSecret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  const secret = getSecret();
  if (!secret) return null;

  const result = await verifyToken(token, secret);
  return result?.user ?? null;
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSession(user);

  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();

  store.delete(COOKIE_NAME);
}

/**
 * Returns the currently signed-in user,
 * or null when there is no valid session.
 */
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies();

  const token = store.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}
