import { MongoClient, Db } from "mongodb";

const globalForMongo = globalThis as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoIndexesReady?: Promise<void>;
};

/**
 * Creates the MongoDB connection only when it is actually needed.
 * This prevents Next.js from trying to connect to MongoDB during build.
 */
function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing.");
  }

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 20,
      minPoolSize: 2,
      compressors: ["zlib"],
    });

    globalForMongo._mongoClientPromise = client.connect();
  }

  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();

  const db = client.db();

  await ensureIndexes(db);

  return db;
}

/**
 * Creates required indexes once per running process.
 */
function ensureIndexes(db: Db): Promise<void> {
  if (!globalForMongo._mongoIndexesReady) {
    globalForMongo._mongoIndexesReady = (async () => {
      try {
        await Promise.all([
          db.collection("users").createIndex(
            { email: 1 },
            { unique: true }
          ),

          db.collection("expenses").createIndex({
            date: -1,
            createdAt: -1,
          }),

          db.collection("expenses").createIndex({
            createdBy: 1,
          }),

          db.collection("backups").createIndex({
            createdAt: -1,
          }),
        ]);
      } catch (error) {
        // Index problems should not prevent normal requests.
        console.warn("Could not create MongoDB indexes:", error);
      }
    })();
  }

  return globalForMongo._mongoIndexesReady;
}

export async function collections() {
  const db = await getDb();

  return {
    db,
    users: db.collection("users"),
    settings: db.collection("settings"),
    expenses: db.collection("expenses"),
    stages: db.collection("stages"),
    subscriptions: db.collection("subscriptions"),
    reminders: db.collection("reminders"),
  };
}