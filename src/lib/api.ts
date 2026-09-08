import { NextResponse } from "next/server";
import { activeUser, getSettings } from "./data";
import { cacheBust } from "./cache";
import { maybeAutoBackup } from "./backup";
import { ENTRY_CURRENCIES } from "./types";
import type { SessionUser } from "./types";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Throws 401 if not signed in. */
export async function requireUser(): Promise<SessionUser> {
  const user = await activeUser();
  if (!user) throw new HttpError(401, "Your session has ended. Please sign in again.");
  return user;
}

/** Throws 403 if signed in but not an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Admin only.");
  return user;
}

/** Wraps a handler so thrown HttpErrors become clean JSON responses. */
export function handle<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}

/** Parses a positive money amount from untrusted input. */
export function parseAmount(input: unknown): number {
  const n = typeof input === "number" ? input : Number(String(input ?? "").replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) throw new HttpError(400, "Enter a valid amount.");
  if (n > 1e12) throw new HttpError(400, "That amount is too large.");
  return Math.round(n * 100) / 100;
}

export function parseText(input: unknown, field: string, max = 200, required = true): string {
  const value = String(input ?? "").trim();
  if (!value) {
    if (required) throw new HttpError(400, `${field} is required.`);
    return "";
  }
  if (value.length > max) throw new HttpError(400, `${field} is too long.`);
  return value;
}

export function parseDate(input: unknown): string {
  const value = String(input ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new HttpError(400, "Enter a valid date.");
  if (Number.isNaN(new Date(`${value}T00:00:00`).getTime())) {
    throw new HttpError(400, "Enter a valid date.");
  }
  return value;
}

export function parseOneOf<T extends string>(
  input: unknown,
  allowed: readonly T[],
  field: string
): T {
  const value = String(input ?? "").trim() as T;
  if (!allowed.includes(value)) throw new HttpError(400, `Choose a valid ${field}.`);
  return value;
}

/**
 * Run after anything that changes data: clears the cache so the next read is fresh, and
 * keeps the rolling backup up to date.
 */
export async function afterWrite(by: string): Promise<void> {
  await cacheBust();
  await maybeAutoBackup(by);
}

/**
 * Amounts can be typed in rupees or in dollars — a lot of the services are priced in dollars.
 * What was typed is kept as-is, and the returned amount is always the figure the budget uses,
 * converted with the rate the admin set.
 */
export async function amountInProjectCurrency(body: {
  amount?: unknown;
  enteredCurrency?: unknown;
}) {
  const enteredAmount = parseAmount(body.amount);
  const enteredCurrency = parseOneOf(body.enteredCurrency ?? "INR", ENTRY_CURRENCIES, "currency");
  const { usdRate } = await getSettings();
  const amount =
    enteredCurrency === "USD" ? Math.round(enteredAmount * usdRate * 100) / 100 : enteredAmount;
  return { amount, enteredAmount, enteredCurrency };
}
