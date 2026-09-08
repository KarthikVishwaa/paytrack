/**
 * Creates (or updates) the admin account straight in the database — handy when you would
 * rather not use the on-screen setup form.
 *
 *   npm run create-admin -- --name "Karthik" --email you@example.com --password "…"
 *
 * If the email already exists it is promoted to admin and the password is reset.
 */
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Check .env.local.");
  process.exit(1);
}

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i === -1 ? "" : String(process.argv[i + 1] ?? "");
};

const name = arg("--name").trim();
const email = arg("--email").trim().toLowerCase();
const password = arg("--password");

if (!name || !email || password.length < 8) {
  console.error(
    'Usage: npm run create-admin -- --name "Your Name" --email you@example.com --password "at least 8 chars"'
  );
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const users = client.db().collection("users");

const passwordHash = await bcrypt.hash(password, 10);
const existing = await users.findOne({ email });

if (existing) {
  await users.updateOne(
    { _id: existing._id },
    { $set: { name, passwordHash, role: "admin", active: true } }
  );
  console.log(email + " updated: now an active admin with the new password.");
} else {
  await users.insertOne({
    _id: randomUUID(),
    name,
    email,
    passwordHash,
    role: "admin",
    active: true,
    createdAt: new Date().toISOString(),
  });
  console.log("Admin created for " + email + ".");
}

await users.createIndex({ email: 1 }, { unique: true });
console.log("Sign in at http://localhost:3000/login");
await client.close();
