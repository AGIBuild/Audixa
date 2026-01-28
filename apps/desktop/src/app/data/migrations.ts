import type { SqlClient } from './sqliteClient';

type Migration = {
  version: number;
  name: string;
  statements: string[];
};

const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_initial_tables',
    statements: [
      `CREATE TABLE IF NOT EXISTS media_sources (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        uri TEXT NOT NULL,
        kind TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS recent_playbacks (
        id TEXT PRIMARY KEY,
        media_source_id TEXT NOT NULL,
        progress REAL NOT NULL,
        last_played_at TEXT NOT NULL,
        FOREIGN KEY(media_source_id) REFERENCES media_sources(id)
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS recent_playbacks_media_source_id_idx
        ON recent_playbacks(media_source_id)`,
      `CREATE TABLE IF NOT EXISTS subtitle_tracks (
        id TEXT PRIMARY KEY,
        media_source_id TEXT NOT NULL,
        language TEXT NOT NULL,
        uri TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(media_source_id) REFERENCES media_sources(id)
      )`,
      `CREATE TABLE IF NOT EXISTS listening_items (
        id TEXT PRIMARY KEY,
        media_source_id TEXT NOT NULL,
        sentence_id TEXT NOT NULL,
        sentence_text TEXT NOT NULL,
        start_ms INTEGER NOT NULL,
        end_ms INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(media_source_id) REFERENCES media_sources(id)
      )`,
      `CREATE TABLE IF NOT EXISTS vocab_items (
        id TEXT PRIMARY KEY,
        word TEXT NOT NULL,
        canonical_word TEXT NOT NULL,
        locale TEXT NOT NULL,
        definition TEXT NOT NULL,
        example TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS vocab_items_canonical_locale_idx
        ON vocab_items(canonical_word, locale)`,
    ],
  },
  {
    version: 2,
    name: 'create_media_libraries',
    statements: [
      `CREATE TABLE IF NOT EXISTS libraries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS library_sources (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        path_or_url TEXT NOT NULL,
        metadata_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id)
      )`,
      `CREATE INDEX IF NOT EXISTS library_sources_library_id_idx
        ON library_sources(library_id)`,
      `CREATE TABLE IF NOT EXISTS library_items (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        source_id TEXT NOT NULL,
        title TEXT NOT NULL,
        uri TEXT NOT NULL,
        kind TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id),
        FOREIGN KEY(source_id) REFERENCES library_sources(id)
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS library_items_library_uri_idx
        ON library_items(library_id, uri)`,
      `CREATE INDEX IF NOT EXISTS library_items_library_id_idx
        ON library_items(library_id)`,
      `CREATE TABLE IF NOT EXISTS library_credentials (
        id TEXT PRIMARY KEY,
        library_id TEXT NOT NULL,
        keyring_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(library_id) REFERENCES libraries(id)
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS library_credentials_library_id_idx
        ON library_credentials(library_id)`,
    ],
  },
  {
    version: 3,
    name: 'create_app_state',
    statements: [
      `CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    ],
  },
  {
    version: 4,
    name: 'add_listening_item_meta',
    statements: [
      `ALTER TABLE listening_items ADD COLUMN title_override TEXT`,
      `ALTER TABLE listening_items ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0`,
      `CREATE INDEX IF NOT EXISTS listening_items_favorite_idx ON listening_items(is_favorite)`,
    ],
  },
  {
    version: 5,
    name: 'add_vocab_pronunciation',
    statements: [`ALTER TABLE vocab_items ADD COLUMN pronunciation TEXT`],
  },
  {
    version: 6,
    name: 'add_vocab_study_fields',
    statements: [
      `ALTER TABLE vocab_items ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0`,
      `ALTER TABLE vocab_items ADD COLUMN is_mastered INTEGER NOT NULL DEFAULT 0`,
    ],
  },
];

export function getLatestSchemaVersion() {
  return migrations[migrations.length - 1]?.version ?? 0;
}

export async function applyMigrations(client: SqlClient) {
  await client.execute(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER NOT NULL,
      applied_at TEXT NOT NULL
    )`,
  );

  const currentVersion = await getCurrentVersion(client);
  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }
    for (const statement of migration.statements) {
      await client.execute(statement);
    }
    await client.execute(
      'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      [migration.version, new Date().toISOString()],
    );
  }
}

async function getCurrentVersion(client: SqlClient) {
  const rows = await client.select<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1',
  );
  return rows[0]?.version ?? 0;
}
