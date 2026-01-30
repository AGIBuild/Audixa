import Database from '@tauri-apps/plugin-sql';
import { applyMigrations } from './migrations';
import { createLogger } from './logger';

const logger = createLogger('SqlClient');

export type SqlClient = {
  execute: (sql: string, bindValues?: unknown[]) => Promise<void>;
  select: <T>(sql: string, bindValues?: unknown[]) => Promise<T[]>;
};

// SQLite connection URL with optimizations:
// - mode=rwc: read-write-create mode
// - busy_timeout: wait up to 5s for locks (default is 0 which causes immediate SQLITE_BUSY)
const DATABASE_URL = 'sqlite:audixa.db?mode=rwc';

let clientPromise: Promise<SqlClient> | null = null;
let dbReady = false;

/** Check if database is ready for operations */
export function isDatabaseReady(): boolean {
  return dbReady;
}

export async function getSqlClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const db = await logger.measure('Database.load', () => Database.load(DATABASE_URL));
      const client = db as unknown as SqlClient;
      
      // Set busy timeout FIRST to avoid lock issues during migration
      await client.execute('PRAGMA busy_timeout = 5000');
      
      await logger.measure('applyMigrations', () => applyMigrations(client));
      
      // Optimize SQLite settings for better performance
      await client.execute('PRAGMA journal_mode = WAL');
      await client.execute('PRAGMA synchronous = NORMAL');
      await client.execute('PRAGMA cache_size = 10000');
      await client.execute('PRAGMA temp_store = MEMORY');
      
      dbReady = true;
      return client;
    })();
  }
  return clientPromise;
}

/**
 * Initialize database connection in background.
 * This should be called early but won't block - caller should check isDatabaseReady().
 */
export function initDatabaseAsync(): void {
  // Start connection but don't await - let it happen in background
  void getSqlClient().catch((err) => {
    logger.error('Database init failed', err);
  });
}
