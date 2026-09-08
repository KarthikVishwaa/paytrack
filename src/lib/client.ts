"use client";

import useSWR, { mutate as globalMutate, type SWRConfiguration } from "swr";
import type { Summary } from "./data";
import type { ExpenseDoc, SettingsDoc, UserDoc } from "./types";
import type { BackupSummary } from "./backup";

export class ApiError extends Error {}

/** One fetch helper for the whole app; turns an error response into a readable message. */
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body ? { "content-type": "application/json", ...init?.headers } : init?.headers,
  });

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
    globalMutate("/api/backups"),
  ]);
}
