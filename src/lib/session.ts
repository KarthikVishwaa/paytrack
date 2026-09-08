import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

import type { Role, SessionUser } from "./types";

export const COOKIE_NAME = "paytrack_session";

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const value = process.env.AUTH_SECRET;

  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. It must be at least 16 characters."
    );
  }

  return new TextEncoder().encode(value);
}

export async function signSession(
  user: SessionUser
): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(
  token: string
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(
      token,
      getSecret()
    );

    if (!payload.sub) {
      return null;
    }

    return {
      id: payload.sub,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(
  user: SessionUser
): Promise<void> {
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