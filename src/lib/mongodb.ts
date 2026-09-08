import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error(
    "MONGODB_URI is missing. Copy .env.local.example to .env.local and set it."
  );
}

// Reuse the client across hot reloads in dev, and across lambda invocations in prod.
const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoIndexesReady?: Promise<void>;
};

const clientPromise: Promise<MongoClient> =
  globalForMongo._mongoClientPromise ??
  (globalForMongo._mongoClientPromise = new MongoClient(uri, {
    serverSelectionTimeoutMS: 8000,
    // Keep sockets warm so a click is not waiting on a new connection.
    maxPoolSize: 20,
    minPoolSize: 2,
    compressors: ["zlib"],
  }).connect());

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db();
  await ensureIndexes(db);
  return db;
}

/** Created once per process — the queries below all sort or look up on these fields. */
function ensureIndexes(db: Db): Promise<void> {
  return (globalForMongo._mongoIndexesReady ??= (async () => {
    try {
      await Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("expenses").createIndex({ date: -1, createdAt: -1 }),
        db.collection("expenses").createIndex({ createdBy: 1 }),
        db.collection("backups").createIndex({ createdAt: -1 }),
      ]);
    } catch (err) {
      // An index that cannot be built is not worth failing a request over.
      console.warn("Could not create indexes:", err);
    }
  })());
}

export async function collections() {
  const db = await getDb();
  return {
    db,
    users: db.collection("users"),
    settings: db.collection("settings"),
    expenses: db.collection("expenses"),
  };
}
