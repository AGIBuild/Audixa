using System;
using Microsoft.Data.Sqlite;

namespace AgiBuild.Audixa.Persistence.Sqlite;

public sealed class SqliteDatabaseInitializer : IDatabaseInitializer
{
    private readonly IAudixaDatabase _db;

    public SqliteDatabaseInitializer(IAudixaDatabase db)
    {
        _db = db;
    }

    public void Initialize()
    {
        using var conn = _db.OpenConnection();

        using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = """
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
""";
            cmd.ExecuteNonQuery();
        }

        var version = GetUserVersion(conn);
        if (version < 1)
        {
            ApplyV1(conn);
            SetUserVersion(conn, 1);
            version = 1;
        }

        if (version < 2)
        {
            ApplyV2(conn);
            SetUserVersion(conn, 2);
            version = 2;
        }

        if (version < 3)
        {
            ApplyV3(conn);
            SetUserVersion(conn, 3);
            version = 3;
        }
    }

    private static int GetUserVersion(SqliteConnection conn)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = "PRAGMA user_version;";
        var v = cmd.ExecuteScalar();
        return v is long l ? (int)l : 0;
    }

    private static void SetUserVersion(SqliteConnection conn, int version)
    {
        using var cmd = conn.CreateCommand();
        cmd.CommandText = $"PRAGMA user_version={version};";
        cmd.ExecuteNonQuery();
    }

    private static void ApplyV1(SqliteConnection conn)
    {
        using var tx = conn.BeginTransaction();

        Execute(conn, """
CREATE TABLE IF NOT EXISTS media_item (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  source_kind INTEGER NOT NULL,
  source_locator TEXT NOT NULL,
  duration_ms INTEGER NULL,
  last_position_ms INTEGER NOT NULL DEFAULT 0,
  last_played_at_utc TEXT NULL,
  updated_at_utc TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_media_item_last_played
  ON media_item(last_played_at_utc DESC);

CREATE TABLE IF NOT EXISTS saved_sentence (
  id TEXT PRIMARY KEY,
  media_item_id TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  primary_text TEXT NOT NULL,
  secondary_text TEXT NULL,
  updated_at_utc TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_saved_sentence_media
  ON saved_sentence(media_item_id);

CREATE TABLE IF NOT EXISTS vocabulary_item (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  context TEXT NULL,
  source_media_item_id TEXT NULL,
  updated_at_utc TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_vocab_word
  ON vocabulary_item(word);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload_json TEXT NULL,
  created_at_utc TEXT NOT NULL,
  sent_at_utc TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_created
  ON outbox(created_at_utc);
""", tx);

        tx.Commit();
    }

    private static void ApplyV2(SqliteConnection conn)
    {
        using var tx = conn.BeginTransaction();

        Execute(conn, """
CREATE TABLE IF NOT EXISTS smb_profile (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  root_path TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_smb_profile_updated
  ON smb_profile(updated_at_utc DESC);
""", tx);

        tx.Commit();
    }

    private static void ApplyV3(SqliteConnection conn)
    {
        using var tx = conn.BeginTransaction();

        Execute(conn, """
CREATE TABLE IF NOT EXISTS secret (
  id TEXT PRIMARY KEY,
  purpose TEXT NOT NULL,
  cipher BLOB NOT NULL,
  updated_at_utc TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_secret_updated
  ON secret(updated_at_utc DESC);
""", tx);

        // Extend SMB profile with structured fields and an optional secret reference.
        Execute(conn, """
ALTER TABLE smb_profile ADD COLUMN host TEXT NULL;
""", tx);
        Execute(conn, """
ALTER TABLE smb_profile ADD COLUMN share TEXT NULL;
""", tx);
        Execute(conn, """
ALTER TABLE smb_profile ADD COLUMN username TEXT NULL;
""", tx);
        Execute(conn, """
ALTER TABLE smb_profile ADD COLUMN domain TEXT NULL;
""", tx);
        Execute(conn, """
ALTER TABLE smb_profile ADD COLUMN secret_id TEXT NULL;
""", tx);

        Execute(conn, """
CREATE INDEX IF NOT EXISTS idx_smb_profile_host_share
  ON smb_profile(host, share);
""", tx);

        tx.Commit();
    }

    private static void Execute(SqliteConnection conn, string sql, SqliteTransaction tx)
    {
        using var cmd = conn.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = sql;
        cmd.ExecuteNonQuery();
    }
}


