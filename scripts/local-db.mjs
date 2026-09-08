/**
 * Starts a local MongoDB on port 27017 with no install needed, keeping the data
 * in ./.localdb so it survives restarts. Leave this running in its own terminal.
 * For production use a real MongoDB (Atlas free tier works) and set MONGODB_URI.
 */
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = fileURLToPath(new URL("../.localdb", import.meta.url));
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: "wiredTiger" },
});

console.log("MongoDB is running at " + server.getUri() + "paytrack");
console.log("Data folder: " + dbPath);
console.log("Leave this window open, then run `npm run dev` in another terminal.");

const stop = async () => {
  await server.stop();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
