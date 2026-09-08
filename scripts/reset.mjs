/**
 * Empties the database: `npm run reset`.
 * Removes every account, budget setting, spending row and revenue row, so the next
 * visit shows the setup screen again. There is no undo.
 */
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Check .env.local.");
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db();

// "revenue" is from an older version of the app and is cleared out if it is still there.
for (const name of ["users", "settings", "expenses", "backups", "revenue"]) {
  const { deletedCount } = await db.collection(name).deleteMany({});
  console.log("cleared " + name + " (" + deletedCount + " removed)");
}

console.log("\nDatabase is empty. Open the site and create your admin account.");
await client.close();
