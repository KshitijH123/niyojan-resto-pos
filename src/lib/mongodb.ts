import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

// Basic scheme validation to provide clearer errors early (avoid driver parse noise)
if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
  // show a short, sanitized prefix to help debugging without printing credentials
  const prefix = typeof uri === "string" ? uri.slice(0, 24) : String(uri);
  // eslint-disable-next-line no-console
  console.error("Invalid MONGODB_URI scheme detected:", prefix);
  throw new Error('Invalid MONGODB_URI. Expected connection string to start with "mongodb://" or "mongodb+srv://"');
}

// Prefer explicit DATABASE_NAME; otherwise try to extract DB name from the connection URI.
const dbFromUri = (() => {
  try {
    const match = uri.match(/\/([^/?]+)(?:\?|$)/);
    return match ? match[1] : undefined;
  } catch (e) {
    return undefined;
  }
})();

const dbName = process.env.DATABASE_NAME || dbFromUri;

if (!dbName) {
  throw new Error(
    "Please define DATABASE_NAME in .env or include the database name in MONGODB_URI (no implicit fallback allowed)."
  );
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb() {
  const client = await clientPromise;
  return client.db(dbName);
}
