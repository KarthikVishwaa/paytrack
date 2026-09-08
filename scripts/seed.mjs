/**
 * Optional demo data: `npm run seed`.
 * Creates the five accounts and a handful of entries so the dashboard is not empty.
 * It refuses to run if the database already has users, unless you pass --reset.
 */
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Check .env.local.");
  process.exit(1);
}

const reset = process.argv.includes("--reset");
const client = new MongoClient(uri);
await client.connect();
const db = client.db();

if (reset) {
  await Promise.all(
    ["users", "settings", "expenses", "revenue", "backups"].map((c) => db.collection(c).deleteMany({}))
  );
  console.log("Cleared existing data.");
} else if ((await db.collection("users").countDocuments({}, { limit: 1 })) > 0) {
  console.error("This database already has users. Run `npm run seed -- --reset` to wipe and reseed.");
  await client.close();
  process.exit(1);
}

const PASSWORD = "paytrack123";
const hash = await bcrypt.hash(PASSWORD, 10);
const now = new Date().toISOString();

const people = [
  { name: "Karthik R", email: "admin@paytrack.local", role: "admin" },
  { name: "Anand Investor", email: "investor@paytrack.local", role: "investor" },
  { name: "Dr. Meera", email: "hod@paytrack.local", role: "hod" },
  { name: "Dev Kumar", email: "developer@paytrack.local", role: "developer" },
  { name: "Sneha Coordinator", email: "coordinator@paytrack.local", role: "coordinator" },
].map((p) => ({ _id: randomUUID(), ...p, passwordHash: hash, active: true, createdAt: now }));

await db.collection("users").insertMany(people);
await db.collection("users").createIndex({ email: 1 }, { unique: true });

await db.collection("settings").updateOne(
  { _id: "app" },
  {
    $set: {
      projectName: "Mobile App Project",
      currency: "INR",
      totalBudget: 522000,
      monthlyInfraBudget: 12000,
      updatedAt: now,
      updatedBy: "Karthik R",
    },
  },
  { upsert: true }
);

const by = (i) => ({ createdBy: people[i]._id, createdByName: people[i].name });
const month = (offset) => {
  const d = new Date();
  d.setMonth(d.getMonth() - offset);
  return d.toISOString().slice(0, 8) + "05";
};

await db.collection("expenses").insertMany([
  { _id: randomUUID(), title: "Play Store developer account", amount: 2100, category: "service", billing: "once", vendor: "Google", date: month(3), notes: "One-time registration", ...by(0), createdAt: now },
  { _id: randomUUID(), title: "Apple developer program", amount: 8900, category: "service", billing: "once", vendor: "Apple", date: month(3), notes: "", ...by(0), createdAt: now },
  { _id: randomUUID(), title: "UI design contract", amount: 45000, category: "service", billing: "once", vendor: "Studio Nine", date: month(2), notes: "Screens + design system", ...by(4), createdAt: now },
  { _id: randomUUID(), title: "Backend hosting", amount: 6500, category: "infrastructure", billing: "monthly", vendor: "AWS", date: month(2), notes: "EC2 + RDS", ...by(3), createdAt: now },
  { _id: randomUUID(), title: "Push notifications + analytics", amount: 1800, category: "infrastructure", billing: "monthly", vendor: "Firebase", date: month(1), notes: "", ...by(3), createdAt: now },
  { _id: randomUUID(), title: "Figma team seats", amount: 3200, category: "tools", billing: "monthly", vendor: "Figma", date: month(1), notes: "3 editors", ...by(4), createdAt: now },
  { _id: randomUUID(), title: "Launch campaign — Instagram", amount: 15000, category: "marketing", billing: "once", vendor: "Meta", date: month(0), notes: "First 2 weeks", ...by(2), createdAt: now },
  { _id: randomUUID(), title: "Intern stipend", amount: 24000, category: "salary", billing: "monthly", vendor: "", date: month(0), notes: "2 interns", ...by(2), createdAt: now },
]);

console.log("Seeded. Sign in with any of these — password: " + PASSWORD);
for (const p of people) console.log("  " + p.role.padEnd(12) + p.email);

await client.close();
