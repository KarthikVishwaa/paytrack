"use client";

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";
import type { Summary } from "./data";
import type { ExpenseDoc, SettingsDoc, StageDoc, SubscriptionDoc, UserDoc } from "./types";
import type { BackupSummary } from "./backup";

export class ApiError extends Error {}

/**
 * Every request in the air right now. When the tab is closed or frozen we abort
 * the lot, so nothing is left holding a connection open in the background.
 */
const inFlight = new Set<AbortController>();

/** Drops every pending request. Called when the tab goes away. */
export function abortInFlight(): void {
  for (const controller of inFlight) controller.abort();
  inFlight.clear();
}

/** One fetch helper for the whole app; turns an error response into a readable message. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  inFlight.add(controller);

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: init?.body
        ? { "content-type": "application/json", ...init?.headers }
        : init?.headers,
    });
  } finally {
    inFlight.delete(controller);
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // A non-JSON body means the server itself fell over.
    throw new ApiError(
      res.ok ? "The server sent something unexpected." : "The server is not responding. Is it still running?"
    );
  }

  if (!res.ok) {
    const message = (body as { error?: string })?.error;
    throw new ApiError(message ?? "Something went wrong (" + res.status + ").");
  }
  return body as T;
}

const fetcher = <T,>(url: string) => api<T>(url);

/**
 * Data stays in the SWR cache between pages, so moving around the app paints instantly and
 * refreshes in the background instead of showing a spinner every time.
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  keepPreviousData: true,
  dedupingInterval: 4000,
  focusThrottleInterval: 10000,
  // No polling anywhere, and nothing revalidates while the tab is in the
  // background — a hidden tab should cost no network and no battery.
  refreshInterval: 0,
  isVisible: () => typeof document === "undefined" || document.visibilityState === "visible",
};

export function useSummary() {
  return useSWR<Summary>("/api/summary", fetcher);
}

export function useExpenses() {
  return useSWR<{ expenses: ExpenseDoc[] }>("/api/expenses", fetcher);
}

export function useSettings() {
  return useSWR<{ settings: SettingsDoc }>("/api/settings", fetcher);
}

export function useUsers() {
  return useSWR<{ users: Omit<UserDoc, "passwordHash">[] }>("/api/users", fetcher);
}

export function useStages() {
  return useSWR<{ stages: StageDoc[] }>("/api/stages", fetcher);
}

export function useSubscriptions() {
  return useSWR<{ subscriptions: SubscriptionDoc[] }>("/api/subscriptions", fetcher);
}

export function useBackups() {
  return useSWR<{ backups: BackupSummary[] }>("/api/backups", fetcher);
}

/** After a write, refresh everything that could have changed — without blocking the UI. */
export function refreshAll() {
  return Promise.all([
    globalMutate("/api/summary"),
    globalMutate("/api/expenses"),
    globalMutate("/api/settings"),
    globalMutate("/api/users"),
    globalMutate("/api/stages"),
    globalMutate("/api/subscriptions"),
    globalMutate("/api/backups"),
  ]);
}
