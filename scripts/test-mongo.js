import fs from 'fs';
import { MongoClient } from 'mongodb';

function parseEnv(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch (e) {
    return {};
  }
}

(async () => {
  const envPath = process.cwd() + '/.env';
  const env = parseEnv(envPath);
  const uri = env.MONGODB_URI || process.env.MONGODB_URI;
  const dbName = env.DATABASE_NAME || process.env.DATABASE_NAME;

  if (!uri) {
    console.error('MONGODB_URI not found in .env or environment');
    process.exit(2);
  }

  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    console.error('Invalid MONGODB_URI scheme. Expected mongodb:// or mongodb+srv://');
    process.exit(2);
  }

  // Sanitize output
  const safePrefix = uri.slice(0, 40).replace(/:[^:@\/]*@/, ':<REDACTED>@');
  console.log('Attempting to connect using URI prefix:', safePrefix);

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db(dbName);
    const res = await db.command({ ping: 1 });
    console.log('Ping response:', res);
    console.log('Connected successfully to', dbName || 'default DB');
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Connection error (sanitized):', err && err.message ? err.message : err);
    // if driver provided errorResponse, print codeName if available
    if (err && err.errorResponse && err.errorResponse.codeName) {
      console.error('Driver codeName:', err.errorResponse.codeName);
    }
    process.exit(1);
  }
})();
