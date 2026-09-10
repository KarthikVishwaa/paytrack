import { collections } from "./mongodb";
import { cached } from "./cache";
import { currentUser } from "./session";
import {
  DEFAULT_SETTINGS,
  DEFAULT_TEAM_SIZE,
  DEFAULT_USD_RATE,
  defaultStages,
  STAGE_STATUS_DEFAULT_PERCENT,
  type ExpenseDoc,
  type ReminderDoc,
  type SessionUser,
  type SettingsDoc,
  type StageDoc,
  type SubscriptionDoc,
  type UserDoc,
} from "./types";

/**
 * The signed-in user, re-checked against the database on every request, so a member who was
 * removed, disabled or given a different role stops being one straight away instead of when
 * their cookie happens to expire.
 */
export async function activeUser(): Promise<SessionUser | null> {
  const session = await currentUser();
  if (!session) return null;

  const { users } = await collections();
  const row = (await users.findOne({ _id: session.id as never })) as UserDoc | null;
  if (!row || !row.active) return null;

  return { id: row._id, name: row.name, email: row.email, role: row.role };
}

/** Reads app settings, creating the default row the first time. */
export async function getSettings(): Promise<SettingsDoc> {
  return cached("settings", loadSettings);
}

async function loadSettings(): Promise<SettingsDoc> {
  const { settings } = await collections();
  const existing = (await settings.findOne({ _id: "app" as never })) as SettingsDoc | null;
  // teamSize was added later, so fill it in for settings saved before that.
  if (existing) {
    return {
      ...existing,
      teamSize: existing.teamSize ?? DEFAULT_TEAM_SIZE,
      usdRate: existing.usdRate || DEFAULT_USD_RATE,
      roadmapPercent: existing.roadmapPercent ?? null,
    };
  }

  const fresh: SettingsDoc = {
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString(),
    updatedBy: "system",
  };
  await settings.insertOne(fresh as never);
  return fresh;
}

/**
 * The development roadmap. Seeded with the plan the first time it is read, so
 * the stages exist without anyone having to set them up.
 */
export async function getStages(): Promise<StageDoc[]> {
  return cached("stages", loadStages);
}

async function loadStages(): Promise<StageDoc[]> {
  const { stages } = await collections();
  const rows = (await stages.find({}).sort({ index: 1 }).toArray()) as unknown as StageDoc[];
  if (rows.length) {
    // percent was added after some stages may already have been seeded —
    // fall back to that status's usual figure until the admin sets one.
    return rows.map((row) => ({
      ...row,
      percent: row.percent ?? STAGE_STATUS_DEFAULT_PERCENT[row.status],
    }));
  }

  const seed = defaultStages();
  await stages.insertMany(seed as never[]);
  return seed;
}

/** Subscriptions the admin is tracking, soonest due date first. */
export async function getSubscriptions(): Promise<SubscriptionDoc[]> {
  return cached("subscriptions", loadSubscriptions);
}

async function loadSubscriptions(): Promise<SubscriptionDoc[]> {
  const { subscriptions } = await collections();
  return (await subscriptions
    .find({})
    .sort({ dueDate: 1 })
    .toArray()) as unknown as SubscriptionDoc[];
}

/** Reminders the admin has posted, newest first. */
export async function getReminders(): Promise<ReminderDoc[]> {
  return cached("reminders", loadReminders);
}

async function loadReminders(): Promise<ReminderDoc[]> {
  const { reminders } = await collections();
  return (await reminders
    .find({})
    .sort({ createdAt: -1 })
    .toArray()) as unknown as ReminderDoc[];
}

export interface Summary {
  settings: SettingsDoc;
  totals: {
    budget: number;
    spent: number;
    remaining: number;
    percentUsed: number;
    monthlyRunRate: number;
    monthlyInfraBudget: number;
    thisMonth: number;
    runwayMonths: number | null;
    expenseCount: number;
  };
  byCategory: { category: string; amount: number; count: number }[];
  byMonth: { month: string; spent: number }[];
  byMember: { name: string; spent: number; count: number }[];
  recentExpenses: ExpenseDoc[];
}

export async function buildSummary(): Promise<Summary> {
  return cached("summary", loadSummary);
}

async function loadSummary(): Promise<Summary> {
  const { expenses } = await collections();
  const [settings, expenseDocs] = await Promise.all([
    getSettings(),
    expenses.find({}).sort({ date: -1, createdAt: -1 }).toArray() as unknown as Promise<
      ExpenseDoc[]
    >,
  ]);

  const spent = sum(expenseDocs.map((e) => e.amount));
  const budget = settings.totalBudget;
  const remaining = budget - spent;

  // Anything billed monthly is treated as a recurring commitment: that is the burn rate.
  const monthlyRunRate = sum(
    expenseDocs.filter((e) => e.billing === "monthly").map((e) => e.amount)
  );

  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonth = sum(
    expenseDocs.filter((e) => e.date.slice(0, 7) === currentMonth).map((e) => e.amount)
  );

  const categoryMap = new Map<string, { amount: number; count: number }>();
  for (const e of expenseDocs) {
    const row = categoryMap.get(e.category) ?? { amount: 0, count: 0 };
    row.amount += e.amount;
    row.count += 1;
    categoryMap.set(e.category, row);
  }

  const monthMap = new Map<string, number>();
  for (const e of expenseDocs) {
    monthMap.set(e.date.slice(0, 7), (monthMap.get(e.date.slice(0, 7)) ?? 0) + e.amount);
  }

  const memberMap = new Map<string, { spent: number; count: number }>();
  for (const e of expenseDocs) {
    const row = memberMap.get(e.createdByName) ?? { spent: 0, count: 0 };
    row.spent += e.amount;
    row.count += 1;
    memberMap.set(e.createdByName, row);
  }

  return {
    settings,
    totals: {
      budget,
      spent,
      remaining,
      percentUsed: budget > 0 ? Math.round((spent / budget) * 1000) / 10 : 0,
      monthlyRunRate,
      monthlyInfraBudget: settings.monthlyInfraBudget,
      thisMonth,
      runwayMonths:
        monthlyRunRate > 0 ? Math.round((remaining / monthlyRunRate) * 10) / 10 : null,
      expenseCount: expenseDocs.length,
    },
    byCategory: [...categoryMap.entries()]
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.amount - a.amount),
    byMonth: [...monthMap.entries()]
      .map(([month, spent]) => ({ month, spent }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12),
    byMember: [...memberMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.spent - a.spent),
    recentExpenses: expenseDocs.slice(0, 8),
  };
}

function sum(values: number[]): number {
  return Math.round(values.reduce((a, b) => a + b, 0) * 100) / 100;
}
