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
};
