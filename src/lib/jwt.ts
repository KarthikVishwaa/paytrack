import { SignJWT, jwtVerify, type JWTPayload } from "jose";

import type { Role, SessionUser } from "./types";

/**
 * Pure token primitives — no "next/headers", so this file is safe to import
 * from Edge middleware as well as from server components/route handlers.
 * src/lib/session.ts wraps this with the actual cookie read/write.
 */

export const COOKIE_NAME = "paytrack_session";

export const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Once less than this much of the window is left, middleware re-signs the
 * cookie with a fresh MAX_AGE — a sliding session. Someone actively using
 * the app never hits the 7-day cliff mid-session; only true inactivity for
 * the whole window logs them out. Checked on the edge, on requests that are
 * already happening, so it costs no extra battery or network round trip.
 */
export const REFRESH_THRESHOLD = 60 * 60 * 24; // 1 day

export function getSecret(): Uint8Array | null {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) return null;
  return new TextEncoder().encode(value);
}

export async function signToken(user: SessionUser, secret: Uint8Array): Promise<string> {
  return new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
}

/** Re-signs an already-verified payload with a fresh expiry, keeping its claims. */
export async function reSignToken(payload: JWTPayload, secret: Uint8Array): Promise<string> {
  return new SignJWT({
    name: payload.name,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.sub))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret);
}

export async function verifyToken(
  token: string,
  secret: Uint8Array
): Promise<{ user: SessionUser; payload: JWTPayload } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;

    return {
      user: {
        id: payload.sub,
        name: String(payload.name ?? ""),
        email: String(payload.email ?? ""),
        role: payload.role as Role,
      },
      payload,
    };
  } catch {
    return null;
  }
}
