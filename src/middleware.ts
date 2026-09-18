import { NextResponse, type NextRequest } from "next/server";

import { COOKIE_NAME, MAX_AGE, REFRESH_THRESHOLD, getSecret, reSignToken, verifyToken } from "@/lib/jwt";

/**
 * Sliding session, done on the edge so it costs nothing extra.
 *
 * The session cookie is a 7-day JWT. Without this, a whole team that signed
 * up on the same day all hit that 7-day wall on the same day too — which is
 * exactly what looked like "everyone got logged out for no reason": it
 * wasn't a bug, it was every session created around the same time expiring
 * around the same time.
 *
 * Every request already carries the cookie and already gets a response, so
 * re-signing it here — once less than a day of the window is left — rides
 * along for free: no extra request, no background timer, nothing that runs
 * while the app isn't already being used. A phone sitting in someone's
 * pocket with the tab in the background does not burn battery on this; it
 * only happens on a request the person is already making. Someone who
 * actually stops opening the app for a full week still gets signed out,
 * which is the intended behaviour, not the bug.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.next();

  const secret = getSecret();
  if (!secret) return NextResponse.next();

  const result = await verifyToken(token, secret);
  if (!result) return NextResponse.next();

  const remaining = (result.payload.exp ?? 0) - Math.floor(Date.now() / 1000);
  if (remaining >= MAX_AGE - REFRESH_THRESHOLD) return NextResponse.next();

  const fresh = await reSignToken(result.payload, secret);

  const response = NextResponse.next();
  response.cookies.set(COOKIE_NAME, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
