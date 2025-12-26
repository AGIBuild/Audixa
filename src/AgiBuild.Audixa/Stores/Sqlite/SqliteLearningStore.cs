using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Persistence;
using Microsoft.Data.Sqlite;

namespace AgiBuild.Audixa.Stores.Sqlite;

public sealed class SqliteLearningStore : ILearningStore
{
    private readonly IAudixaDatabase _db;

    public SqliteLearningStore(IAudixaDatabase db)
    {
        _db = db;
    }

    public async Task AddSavedSentenceAsync(SavedSentence sentence)
    {
        await using var conn = _db.OpenConnection();
        await using var tx = conn.BeginTransaction();

        await using (var cmd = conn.CreateCommand())
        {
            cmd.Transaction = tx;
            cmd.CommandText = """
INSERT INTO saved_sentence (id, media_item_id, start_ms, end_ms, primary_text, secondary_text, updated_at_utc, deleted)
VALUES ($id, $mid, $start, $end, $p, $s, $updated, $deleted)
ON CONFLICT(id) DO UPDATE SET
  media_item_id=excluded.media_item_id,
  start_ms=excluded.start_ms,
  end_ms=excluded.end_ms,
  primary_text=excluded.primary_text,
  secondary_text=excluded.secondary_text,
  updated_at_utc=excluded.updated_at_utc,
  deleted=excluded.deleted;
""";
            cmd.Parameters.AddWithValue("$id", sentence.Id);
            cmd.Parameters.AddWithValue("$mid", sentence.MediaItemId);
            cmd.Parameters.AddWithValue("$start", (long)sentence.Start.TotalMilliseconds);
            cmd.Parameters.AddWithValue("$end", (long)sentence.End.TotalMilliseconds);
            cmd.Parameters.AddWithValue("$p", sentence.PrimaryText);
            cmd.Parameters.AddWithValue("$s", (object?)sentence.SecondaryText ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$updated", sentence.UpdatedAtUtc.UtcDateTime.ToString("O"));
            cmd.Parameters.AddWithValue("$deleted", sentence.Deleted ? 1 : 0);
            await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
        }

        await WriteOutbox(conn, tx, "saved_sentence", sentence.Id, "upsert",
            JsonSerializer.Serialize(new { sentence.Id, sentence.MediaItemId })).ConfigureAwait(false);

        tx.Commit();
    }

    public async Task AddVocabularyAsync(VocabularyItem item)
    {
        await using var conn = _db.OpenConnection();
        await using var tx = conn.BeginTransaction();

        await using (var cmd = conn.CreateCommand())
        {
            cmd.Transaction = tx;
            cmd.CommandText = """
INSERT INTO vocabulary_item (id, word, context, source_media_item_id, updated_at_utc, deleted)
VALUES ($id, $word, $ctx, $src, $updated, $deleted)
ON CONFLICT(id) DO UPDATE SET
  word=excluded.word,
  context=excluded.context,
  source_media_item_id=excluded.source_media_item_id,
  updated_at_utc=excluded.updated_at_utc,
  deleted=excluded.deleted;
""";
            cmd.Parameters.AddWithValue("$id", item.Id);
            cmd.Parameters.AddWithValue("$word", item.Word);
            cmd.Parameters.AddWithValue("$ctx", (object?)item.Context ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$src", (object?)item.SourceMediaItemId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("$updated", item.UpdatedAtUtc.UtcDateTime.ToString("O"));
            cmd.Parameters.AddWithValue("$deleted", item.Deleted ? 1 : 0);
            await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
        }

        await WriteOutbox(conn, tx, "vocabulary_item", item.Id, "upsert",
            JsonSerializer.Serialize(new { item.Id, item.Word })).ConfigureAwait(false);

        tx.Commit();
    }

    public async Task<int> GetSavedSentenceCountAsync()
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM saved_sentence WHERE deleted=0;";
        var v = await cmd.ExecuteScalarAsync().ConfigureAwait(false);
        return v is long l ? (int)l : 0;
    }

    public async Task<int> GetVocabularyCountAsync()
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT COUNT(*) FROM vocabulary_item WHERE deleted=0;";
        var v = await cmd.ExecuteScalarAsync().ConfigureAwait(false);
        return v is long l ? (int)l : 0;
    }

    public async Task<IReadOnlyList<SavedSentence>> GetSavedSentencesAsync(int limit)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
SELECT id, media_item_id, start_ms, end_ms, primary_text, secondary_text, updated_at_utc, deleted
FROM saved_sentence
WHERE deleted=0
ORDER BY updated_at_utc DESC
LIMIT $limit;
""";
        cmd.Parameters.AddWithValue("$limit", limit);

        var list = new List<SavedSentence>();
        await using var reader = await cmd.ExecuteReaderAsync().ConfigureAwait(false);
        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            list.Add(new SavedSentence(
                Id: reader.GetString(0),
                MediaItemId: reader.GetString(1),
                Start: TimeSpan.FromMilliseconds(reader.GetInt64(2)),
                End: TimeSpan.FromMilliseconds(reader.GetInt64(3)),
                PrimaryText: reader.GetString(4),
                SecondaryText: reader.IsDBNull(5) ? null : reader.GetString(5),
                UpdatedAtUtc: DateTimeOffset.Parse(reader.GetString(6)),
                Deleted: reader.GetInt64(7) != 0));
        }

        return list;
    }

    public async Task<IReadOnlyList<VocabularyItem>> GetVocabularyAsync(int limit)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
SELECT id, word, context, source_media_item_id, updated_at_utc, deleted
FROM vocabulary_item
WHERE deleted=0
ORDER BY updated_at_utc DESC
LIMIT $limit;
""";
        cmd.Parameters.AddWithValue("$limit", limit);

        var list = new List<VocabularyItem>();
        await using var reader = await cmd.ExecuteReaderAsync().ConfigureAwait(false);
        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            list.Add(new VocabularyItem(
                Id: reader.GetString(0),
                Word: reader.GetString(1),
                Context: reader.IsDBNull(2) ? null : reader.GetString(2),
                SourceMediaItemId: reader.IsDBNull(3) ? null : reader.GetString(3),
                UpdatedAtUtc: DateTimeOffset.Parse(reader.GetString(4)),
                Deleted: reader.GetInt64(5) != 0));
        }

        return list;
    }

    private static async Task WriteOutbox(SqliteConnection conn, SqliteTransaction tx, string entityType, string entityId, string op, string? payloadJson)
    {
        await using var cmd = conn.CreateCommand();
        cmd.Transaction = tx;
        cmd.CommandText = """
INSERT INTO outbox (id, entity_type, entity_id, operation, payload_json, created_at_utc, sent_at_utc)
VALUES ($id, $type, $eid, $op, $payload, $created, NULL);
""";
        cmd.Parameters.AddWithValue("$id", Guid.NewGuid().ToString("N"));
        cmd.Parameters.AddWithValue("$type", entityType);
        cmd.Parameters.AddWithValue("$eid", entityId);
        cmd.Parameters.AddWithValue("$op", op);
        cmd.Parameters.AddWithValue("$payload", (object?)payloadJson ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$created", DateTimeOffset.UtcNow.UtcDateTime.ToString("O"));
        await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
}


