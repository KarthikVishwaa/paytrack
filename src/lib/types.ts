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

/**
 * What each stage actually covers, shown when someone taps a stage to expand
 * it on the Progress page. Keyed by stage name rather than stored on the
 * document, so it can change without touching anything in the database.
 */
export const STAGE_DETAILS: Record<string, string[]> = {
  "Architecture and setup": [
    "Cloud infrastructure provisioned in India",
    "Database designed and deployed",
    "Automated build pipeline — code to installable app with no manual steps",
    "Staging environment live — separate from production",
    "Architecture decisions documented",
    "API structure defined",
  ],
  "User onboarding": [
    "Language selection",
    "Phone number login with OTP",
    "Age verification — under-18 permanently blocked",
    "Gender selection",
    "Profile creation — name and illustrated avatar",
    "Automatic login on app reopen",
    "Onboarding completes in under 90 seconds",
  ],
  "Voice rooms": [
    "Create and list rooms by language",
    "Join a room and hear the host speaking",
    "Real-time speaking indicators",
    "Listener count updates live",
    "Request the microphone — enters host's queue",
    "Host approves or denies speakers",
    "Host can mute, remove from seat, remove from room",
    "In-room text chat",
    "Two phones on separate networks hold a conversation",
  ],
  "One-to-one calling": [
    "See who is online",
    "Tap to call from a profile",
    "Incoming call notification on locked screen",
    "Free first minute with visible countdown",
    "Paywall at 60 seconds — continue for ₹99",
    "Paid call with timer and cost display",
    "Call ends cleanly at zero balance",
    "Call history — outgoing, incoming, missed",
    "Call-back from missed calls",
    "Who-can-call-me privacy setting",
  ],
  "Payments and wallet": [
    "Wallet screen with coin balance",
    "Coin packs at three price points",
    "Google Play payment flow — all states handled",
    "Server verifies every purchase with Google directly",
    "Interrupted purchase cannot charge twice",
    "Transaction history — complete and itemised",
    "Refunds handled automatically when Google issues one",
    "Purchase confirmation screen with receipt",
  ],
  "Gifting and host earnings": [
    "Gift picker — four tiers",
    "Gift animation in the room",
    "Coins deducted from sender, credited to host — one transaction",
    "Host earnings screen — today, this week, rupee conversion",
    "Payout threshold and status tracking",
    "Host KYC collection for payouts",
  ],
  "Safety and compliance": [
    "Report any user — one tap from any avatar",
    "Block any user — enforced both directions everywhere",
    "Report categories — harassment, sexual content, asking for money, seems underage, impersonation",
    "Last 60 seconds of room audio captured automatically with every report",
    "Moderation console — view reports, play evidence, take action",
    "Moderation audit log — who decided what, when, on what evidence",
    "Room auto-closes after three reports in one hour",
    "Account deletion — in the app and on a web page",
    "Deleted account genuinely erased — financial and legal records anonymised and retained",
    "Grievance officer contact published — in the app, on the website, in the privacy policy",
    "Complaint acknowledged within 24 hours, resolved within 15 days",
    "180-day log retention within India — CERT-In compliance",
  ],
  "Quality and performance": [
    "Tested on three entry-level phones — 2 GB RAM, ₹8,000 range",
    "Tested on 3G network speeds",
    "Tested on Android versions 7 through 15",
    "App opens in under 3 seconds",
    "Audio survives screen lock, home button, app switch, incoming phone call",
    "Audio reconnects automatically after a network drop",
    "One room tested with 500 simultaneous participants",
    "Crash rate below 1% of sessions",
    "Database backup restored successfully — not assumed, actually tested",
    "Monitoring alerts wired to a phone someone answers at 2am",
  ],
  "Play Store submission": [
    "Store listing complete — name, icon, screenshots, description",
    "Privacy policy published and linked from inside the app",
    "Data Safety declaration matches actual app behaviour exactly",
    "Content rating questionnaire completed accurately",
    "Every permission justified — only what shipped features need",
    "Reviewer test credentials prepared",
    "Submitted to closed testing track",
    "Incident response plan documented — including 6-hour CERT-In reporting",
  ],
  "Closed beta": [
    "Beta distributed to 100–200 real users",
    "Onboarding funnel monitored live",
    "Same-day fixes on critical issues",
    "Every report in the moderation queue answered within 24 hours",
    "First-session speak rate measured — target 25%",
    "Day-1 retention measured — target 30%",
    "Day-7 retention measured — target 12%",
    "Coin purchase conversion measured — target 2%",
    "Actual voice minute cost compared against budget",
    "Beta review completed — decision on what changes before public launch",
  ],
  "Voice Moments": [
    "Daily random notification between 6pm and 11pm",
    "30-second voice recording — two-minute window, no filters, no re-recording",
    "Must share your moment before listening to anyone else's",
    "Moment appears on your profile for 24 hours, then expires",
    "Late moments accepted but marked late",
    "Three consecutive misses dim the badge",
    "Voice replies — 15-second response to someone's moment",
    "Moderation — same report queue as rooms, same evidence rules",
  ],
  Games: [
    "Games section in the bottom navigation — separate from rooms",
    "Three free game sessions per day — unlimited for subscribers",
    "Tambola / Housie — room-based, voice on during play",
    "Word chain / Antakshari — turn-based, voice on",
    "Movie quiz — buzz-in format, fixed question bank from server",
    "Daily challenge at 7pm — leaderboard resets at midnight",
    "24-hour winner badge — visible in rooms and on calls",
    "Weekly tournament — Sunday 8pm, bracket format, crown badge",
    "Friends list carries across — invite friends to a table",
    "Ludo — turn-based, 2–4 players",
    "Carrom — real-time with physics",
    "Truth or Dare — fixed prompts, not user-generated",
    "Coin-entry games — only after legal approval per state",
  ],
};

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

// ---- Subscription reminders ---------------------------------------------
// Recurring bills the admin wants a heads-up on before they renew — a domain,
// hosting, the Play Console — so the team can have the payment ready in time.

export interface SubscriptionDoc {
  _id: string;
  title: string;
  /** The next renewal date, YYYY-MM-DD. */
  dueDate: string;
  /** What it costs to renew. 0 if the admin didn't set one. */
  amount: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/** Whole days from today until the due date. Negative once it's overdue. Always worked out fresh from today's date, never stored. */
export function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00:00");
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}
