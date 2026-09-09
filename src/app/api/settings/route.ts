import { NextResponse } from "next/server";
import { collections } from "@/lib/mongodb";
import { getSettings } from "@/lib/data";
import {
  afterWrite,
  handle,
  HttpError,
  parseAmount,
  parseText,
  requireAdmin,
  requireUser,
} from "@/lib/api";

export const dynamic = "force-dynamic";

/** Blank or missing means "leave as is" on read, "clear the override" on save. */
function parseRoadmapPercent(input: unknown, current: number | null): number | null {
  if (input === undefined) return current;
  if (input === null || String(input).trim() === "") return null;
  const n = typeof input === "number" ? input : Number(String(input).trim());
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw new HttpError(400, "Overall completion must be between 0 and 100.");
  }
  return Math.round(n);
}

export const GET = handle(async () => {
  await requireUser();
  return NextResponse.json({ settings: await getSettings() });
});

/** Only the admin (host) sets the budget. */
export const PUT = handle(async (req: Request) => {
  const admin = await requireAdmin();
  const body = await req.json();

  const current = await getSettings();
  const { settings, users } = await collections();

  const teamSize = Math.round(parseAmount(body.teamSize ?? current.teamSize));
  const usdRate = parseAmount(body.usdRate ?? current.usdRate);
  if (usdRate <= 0) throw new HttpError(400, "The dollar rate has to be more than zero.");
  const taken = await users.countDocuments({});
  if (teamSize < 1 || teamSize > 50) throw new HttpError(400, "Team size must be between 1 and 50.");
  if (teamSize < taken) {
    throw new HttpError(400, "There are already " + taken + " accounts. Remove someone first.");
  }
  const update = {
    projectName: parseText(body.projectName ?? current.projectName, "Project name", 80),
    currency: parseText(body.currency ?? current.currency, "Currency", 8).toUpperCase(),
    totalBudget: parseAmount(body.totalBudget ?? current.totalBudget),
    monthlyInfraBudget: parseAmount(body.monthlyInfraBudget ?? current.monthlyInfraBudget),
    teamSize,
    usdRate,
    roadmapPercent: parseRoadmapPercent(body.roadmapPercent, current.roadmapPercent),
    updatedAt: new Date().toISOString(),
    updatedBy: admin.name,
  };

  await settings.updateOne({ _id: "app" as never }, { $set: update }, { upsert: true });
  await afterWrite(admin.name);
  return NextResponse.json({ settings: { _id: "app", ...update } });
});
