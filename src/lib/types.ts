export const ROLES = ["admin", "investor", "hod", "developer", "coordinator"] as const;
export type Role = (typeof ROLES)[number];

export const MEMBER_ROLES = ROLES.filter((r) => r !== "admin");

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Admin (Host)",
  investor: "Investor",
  hod: "HOD",
  developer: "Developer",
  coordinator: "Coordinator",
};

export const EXPENSE_CATEGORIES = [
  "service",
  "infrastructure",
  "tools",
  "marketing",
  "salary",
  "other",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  service: "Services bought",
  infrastructure: "Infrastructure",
  tools: "Tools & licences",
  marketing: "Marketing",
  salary: "People / stipend",
  other: "Other",
};

export type Billing = "once" | "monthly";

/** What someone typed the amount in. Services are often priced in dollars. */
export const ENTRY_CURRENCIES = ["INR", "USD"] as const;
export type EntryCurrency = (typeof ENTRY_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
};

/** One colour per category, matching the CSS variables in globals.css. */
export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  service: "var(--cat-service)",
  infrastructure: "var(--cat-infrastructure)",
  tools: "var(--cat-tools)",
  marketing: "var(--cat-marketing)",
  salary: "var(--cat-salary)",
  other: "var(--cat-other)",
};

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

/** How many accounts the team may have in total, admin included. */
export const DEFAULT_TEAM_SIZE = 3;

/** Starting rupees-per-dollar; the admin can change it. */
export const DEFAULT_USD_RATE = 88;

export interface SettingsDoc {
  _id: "app";
  projectName: string;
  currency: string;
  totalBudget: number;
  monthlyInfraBudget: number;
  teamSize: number;
  /** How many rupees to a dollar, for entries typed in dollars. */
  usdRate: number;
  /** Admin override for the Progress page's overall figure. null = calculate it from stage status. */
  roadmapPercent: number | null;
  updatedAt: string;
  updatedBy: string;
}

export interface ExpenseDoc {
  _id: string;
  title: string;
  /** Always in the project currency, whatever it was typed in. */
  amount: number;
  /** What was actually typed, kept so the original figure is still visible. */
  enteredAmount: number;
  enteredCurrency: EntryCurrency;
  category: ExpenseCategory;
  billing: Billing;
  vendor: string;
  date: string; // YYYY-MM-DD
  notes: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

export const DEFAULT_SETTINGS: Omit<SettingsDoc, "updatedAt" | "updatedBy"> = {
  _id: "app",
  projectName: "Mobile App Project",
  currency: "INR",
  totalBudget: 522000,
  monthlyInfraBudget: 0,
  teamSize: DEFAULT_TEAM_SIZE,
  usdRate: DEFAULT_USD_RATE,
  roadmapPercent: null,
};

// ---- Project status (investor-facing roadmap) --------------------------
// Twelve build stages the admin marks the status of by hand. Everyone else
// only ever views this page — the detail is deliberately coarse (a status
// and, for a blocked stage, one line on why), never a developer task list.

export const STAGE_STATUSES = ["not_started", "in_progress", "in_review", "completed", "blocked"] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  in_review: "In review",
  completed: "Complete",
  blocked: "Blocked",
};

/** One representative fill level per status — a status is an honest, coarse
 *  signal, not a task count, so each maps to a single bar height. */
export const STAGE_STATUS_PERCENT: Record<StageStatus, number> = {
  not_started: 0,
  in_progress: 50,
  in_review: 80,
  completed: 100,
  blocked: 35,
};

export interface StageDoc {
  _id: string;
  index: number;
  name: string;
  /** One line of scope, shown under the name — what the stage covers, not a checklist. */
  summary: string;
  status: StageStatus;
  /** Why it's stuck. Only shown (and only meaningful) while status is "blocked". */
  note: string;
  updatedAt: string;
  updatedBy: string;
}

const STAGE_SEED: { name: string; summary: string }[] = [
  {
    name: "Architecture and setup",
    summary:
      "Project scaffolding, infrastructure provisioned, CI/CD pipeline live, database designed, architecture decisions documented",
  },
  {
    name: "User onboarding",
    summary: "Login with OTP, age verification, profile creation, avatar selection, session management",
  },
  {
    name: "Voice rooms",
    summary: "Live audio rooms, host controls, seat management, speaking indicators, listener mode",
  },
  {
    name: "One-to-one calling",
    summary: "Private voice calls, incoming call notifications, call history, missed calls",
  },
  {
    name: "Payments and wallet",
    summary: "Coin purchase via Google Play, wallet, transaction history, receipt validation, refund handling",
  },
  {
    name: "Gifting and host earnings",
    summary: "In-room gifts, host earnings dashboard, payout system",
  },
  {
    name: "Safety and compliance",
    summary:
      "Report and block, audio evidence capture, moderation console, account deletion, DPDP compliance, grievance officer",
  },
  {
    name: "Quality and performance",
    summary: "Device testing on entry-level phones, crash fixes, load testing, monitoring and alerting",
  },
  {
    name: "Play Store submission",
    summary: "Store listing, Data Safety declaration, content rating, closed testing track submission",
  },
  {
    name: "Closed beta",
    summary: "Beta with 100–200 real users, retention measurement, moderation active, cost tracking",
  },
  {
    name: "Voice Moments",
    summary: "Daily spontaneous audio status, reciprocity mechanic, trust layer",
  },
  {
    name: "Games",
    summary: "Tambola, word games, movie quiz, daily challenges, leaderboards",
  },
];

/** The roadmap as it starts out: every stage not started. */
export function defaultStages(): StageDoc[] {
  const now = new Date().toISOString();
  return STAGE_SEED.map((stage, index) => ({
    _id: `stage-${index}`,
    index,
    name: stage.name,
    summary: stage.summary,
    status: "not_started" as StageStatus,
    note: "",
    updatedAt: now,
    updatedBy: "system",
  }));
}

/** How full a stage's bar looks. */
export function stagePercent(stage: StageDoc): number {
  return STAGE_STATUS_PERCENT[stage.status];
}

/**
 * Overall build progress: the average of every stage's fill. The admin can pin
 * this to a specific figure instead (SettingsDoc.roadmapPercent) — callers should
 * prefer that value when it is set.
 */
export function overallPercent(stages: StageDoc[]): number {
  if (stages.length === 0) return 0;
  const total = stages.reduce((sum, s) => sum + stagePercent(s), 0);
  return Math.round(total / stages.length);
}
