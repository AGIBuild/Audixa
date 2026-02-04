/**
 * Mobile SQLite Database
 *
 * This module provides database initialization and migration for the mobile app.
 * Uses react-native-sqlite-storage for cross-platform SQLite support.
 *
 * Note: This is a placeholder implementation. The actual SQLite integration
 * requires installing react-native-sqlite-storage and running pod install.
 */

/**
 * Database schema version
 */
export const DB_VERSION = 1;

/**
 * Database name
 */
export const DB_NAME = 'audixa.db';

/**
 * Schema migrations
 */
export const migrations: Record<number, string[]> = {
  1: [
    // Libraries table
    `CREATE TABLE IF NOT EXISTS libraries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    // Library sources table
    `CREATE TABLE IF NOT EXISTS library_sources (
      id TEXT PRIMARY KEY,
      library_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      path_or_url TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
    )`,

    // Library items table
    `CREATE TABLE IF NOT EXISTS library_items (
      id TEXT PRIMARY KEY,
      library_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      title TEXT NOT NULL,
      uri TEXT NOT NULL,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
    )`,

    // Media sources table
    `CREATE TABLE IF NOT EXISTS media_sources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      uri TEXT NOT NULL UNIQUE,
      kind TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    // Recent playback table
    `CREATE TABLE IF NOT EXISTS recent_playback (
      id TEXT PRIMARY KEY,
      media_source_id TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      last_played_at TEXT NOT NULL,
      FOREIGN KEY (media_source_id) REFERENCES media_sources(id) ON DELETE CASCADE
    )`,

    // Subtitle tracks table
    `CREATE TABLE IF NOT EXISTS subtitle_tracks (
      id TEXT PRIMARY KEY,
      media_source_id TEXT NOT NULL,
      language TEXT,
      uri TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (media_source_id) REFERENCES media_sources(id) ON DELETE CASCADE
    )`,

    // Listening items table
    `CREATE TABLE IF NOT EXISTS listening_items (
      id TEXT PRIMARY KEY,
      media_source_id TEXT NOT NULL,
      sentence_id TEXT NOT NULL,
      sentence_text TEXT NOT NULL,
      start_ms INTEGER NOT NULL,
      end_ms INTEGER NOT NULL,
      title_override TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (media_source_id) REFERENCES media_sources(id) ON DELETE CASCADE
    )`,

    // Vocabulary items table
    `CREATE TABLE IF NOT EXISTS vocab_items (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL,
      canonical_word TEXT NOT NULL,
      locale TEXT NOT NULL DEFAULT 'en',
      definition TEXT NOT NULL,
      example TEXT,
      source TEXT,
      pronunciation TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_mastered INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      last_seen_at TEXT NOT NULL
    )`,

    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_library_items_library_id ON library_items(library_id)`,
    `CREATE INDEX IF NOT EXISTS idx_listening_items_media_source_id ON listening_items(media_source_id)`,
    `CREATE INDEX IF NOT EXISTS idx_vocab_items_canonical_word ON vocab_items(canonical_word, locale)`,
    `CREATE INDEX IF NOT EXISTS idx_recent_playback_last_played ON recent_playback(last_played_at DESC)`,
  ],
};

/**
 * Database interface (to be implemented with actual SQLite)
 */
export interface MobileDatabase {
  executeSql: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  close: () => Promise<void>;
}

/**
 * Initialize database with migrations
 */
export async function initDatabase(): Promise<MobileDatabase | null> {
  // Placeholder: actual implementation requires react-native-sqlite-storage
  console.log('Database initialization placeholder');
  return null;
}

/**
 * Run migrations
 */
export async function runMigrations(db: MobileDatabase): Promise<void> {
  // Get current version
  // Run migrations in order
  // Update version
  console.log('Running migrations placeholder');
}
