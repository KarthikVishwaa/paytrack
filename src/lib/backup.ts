/**
 * Safety net for the data.
 *
 * A backup is one document in the `backups` collection holding a copy of everything else:
 * accounts, settings and spending. It lives in the same database, so if a page
 * breaks, someone deletes the wrong row, or a bad edit goes in, the admin can put the whole
 * thing back from the Admin page without touching MongoDB directly.
 *
 * One is taken automatically at most once an hour whenever data changes, and the admin can
 * take one at any time. The newest 20 are kept.
 */
import { collections } from "./mongodb";
import { cacheBust } from "./cache";
import type { ExpenseDoc, SettingsDoc, UserDoc } from "./types";

const KEEP = 20;
const AUTO_EVERY_MS = 60 * 60 * 1000; // one hour

export type BackupReason = "manual" | "automatic" | "before-restore";

export interface BackupSummary {
  _id: string;
  createdAt: string;
  createdBy: string;
  reason: BackupReason;
  counts: { users: number; expenses: number };
}

export interface BackupDoc extends BackupSummary {
  data: {
    users: UserDoc[];
    settings: SettingsDoc | null;
    expenses: ExpenseDoc[];
  };
}

export async function createBackup(
  createdBy: string,
  reason: BackupReason = "manual"
): Promise<BackupSummary> {
  const { users, settings, expenses } = await collections();

  const [userRows, settingsRow, expenseRows] = await Promise.all([
    users.find({}).toArray() as unknown as Promise<UserDoc[]>,
    settings.findOne({ _id: "app" as never }) as unknown as Promise<SettingsDoc | null>,
    expenses.find({}).toArray() as unknown as Promise<ExpenseDoc[]>,
  ]);

  const doc: BackupDoc = {
    _id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    createdBy,
    reason,
    counts: {
      users: userRows.length,
      expenses: expenseRows.length,
    },
    data: {
      users: userRows,
      settings: settingsRow,
      expenses: expenseRows,
    },
  };

  const backups = await backupCollection();
  await backups.insertOne(doc as never);

  // Trim the history so the collection cannot grow without limit.
  const old = (await backups
    .find({}, { projection: { _id: 1 } })
    .sort({ createdAt: -1 })
    .skip(KEEP)
    .toArray()) as unknown as { _id: string }[];
  if (old.length) {
    await backups.deleteMany({ _id: { $in: old.map((o) => o._id) } as never });
  }

  const { data: _data, ...summary } = doc;
  return summary;
}

export async function listBackups(): Promise<BackupSummary[]> {
  const backups = await backupCollection();
  return (await backups
    .find({}, { projection: { data: 0 } })
    .sort({ createdAt: -1 })
    .toArray()) as unknown as BackupSummary[];
}

export async function getBackup(id: string): Promise<BackupDoc | null> {
  const backups = await backupCollection();
  return (await backups.findOne({ _id: id as never })) as unknown as BackupDoc | null;
}

/**
 * Puts a snapshot back. The current data is backed up first, so restoring the wrong one is
 * itself undoable.
 */
export async function restoreBackup(
  id: string,
  restoredBy: string
): Promise<BackupSummary["counts"]> {
  const snapshot = await getBackup(id);
  if (!snapshot) throw new Error("That backup no longer exists.");

  await createBackup(restoredBy, "before-restore");

  const { users, settings, expenses } = await collections();
  await Promise.all([users.deleteMany({}), settings.deleteMany({}), expenses.deleteMany({})]);

  if (snapshot.data.users.length) await users.insertMany(snapshot.data.users as never[]);
  if (snapshot.data.settings) await settings.insertOne(snapshot.data.settings as never);
  if (snapshot.data.expenses.length) await expenses.insertMany(snapshot.data.expenses as never[]);

  await cacheBust();
  return snapshot.counts;
}

export async function deleteBackup(id: string): Promise<void> {
  const backups = await backupCollection();
  await backups.deleteOne({ _id: id as never });
}

/**
 * Called after writes. Takes a snapshot only if the last automatic one is over an hour old,
 * and never blocks the request that triggered it.
 */
export async function maybeAutoBackup(createdBy: string): Promise<void> {
  try {
    const backups = await backupCollection();
    const last = (await backups
      .find({}, { projection: { createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()) as unknown as { createdAt: string }[];

    const lastAt = last[0] ? new Date(last[0].createdAt).getTime() : 0;
    if (Date.now() - lastAt < AUTO_EVERY_MS) return;

    await createBackup(createdBy, "automatic");
  } catch (err) {
    // A failed backup must never break the thing the user was actually doing.
    console.error("Automatic backup failed:", err);
  }
}

async function backupCollection() {
  const { db } = await collections();
  return db.collection("backups");
}
