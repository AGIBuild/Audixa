import Database from '@tauri-apps/plugin-sql';
import { applyMigrations } from './migrations';

export type SqlClient = {
  execute: (sql: string, bindValues?: unknown[]) => Promise<void>;
  select: <T>(sql: string, bindValues?: unknown[]) => Promise<T[]>;
};

const DATABASE_URL = 'sqlite:audixa.db';

let clientPromise: Promise<SqlClient> | null = null;

export async function getSqlClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const db = await Database.load(DATABASE_URL);
      await applyMigrations(db as SqlClient);
      return db as SqlClient;
    })();
  }
  return clientPromise;
}
