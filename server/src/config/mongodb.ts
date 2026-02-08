import { MongoClient, Db } from 'mongodb';
import { env } from './env.js';
import { logger } from './logger.js';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(env.MONGODB_URI, {
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
  });

  await client.connect();
  db = client.db(env.MONGODB_DB_NAME);
  logger.info({ dbName: env.MONGODB_DB_NAME }, 'MongoDB connected');
  return db;
}

export function getDb(): Db {
  if (!db) throw new Error('Database not connected. Call connectDb() first.');
  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    logger.info('MongoDB disconnected');
  }
}
