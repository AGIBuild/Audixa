using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Persistence;
using Microsoft.Data.Sqlite;

namespace AgiBuild.Audixa.Stores.Sqlite;

public sealed class SqliteLibraryStore : ILibraryStore
{
    private readonly IAudixaDatabase _db;

    public SqliteLibraryStore(IAudixaDatabase db)
    {
        _db = db;
    }

    public async Task UpsertMediaAsync(MediaItem item, DateTimeOffset playedAtUtc)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();

        cmd.CommandText = """
INSERT INTO media_item (id, display_name, source_kind, source_locator, duration_ms, last_played_at_utc, updated_at_utc, deleted)
VALUES ($id, $name, $kind, $loc, $dur, $played, $updated, 0)
ON CONFLICT(id) DO UPDATE SET
  display_name=excluded.display_name,
  source_kind=excluded.source_kind,
  source_locator=excluded.source_locator,
  duration_ms=excluded.duration_ms,
  last_played_at_utc=excluded.last_played_at_utc,
  updated_at_utc=excluded.updated_at_utc,
  deleted=0;
""";

        cmd.Parameters.AddWithValue("$id", item.Id);
        cmd.Parameters.AddWithValue("$name", item.DisplayName);
        cmd.Parameters.AddWithValue("$kind", (int)item.SourceKind);
        cmd.Parameters.AddWithValue("$loc", item.SourceLocator);
        cmd.Parameters.AddWithValue("$dur", item.Duration is null ? DBNull.Value : (long)item.Duration.Value.TotalMilliseconds);
        cmd.Parameters.AddWithValue("$played", playedAtUtc.UtcDateTime.ToString("O"));
        cmd.Parameters.AddWithValue("$updated", DateTimeOffset.UtcNow.UtcDateTime.ToString("O"));

        await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
    }

    public async Task SaveProgressAsync(string mediaItemId, TimeSpan position, DateTimeOffset updatedAtUtc)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();

        cmd.CommandText = """
UPDATE media_item
SET last_position_ms = $pos,
    updated_at_utc = $updated
WHERE id = $id;
""";
        cmd.Parameters.AddWithValue("$id", mediaItemId);
        cmd.Parameters.AddWithValue("$pos", (long)position.TotalMilliseconds);
        cmd.Parameters.AddWithValue("$updated", updatedAtUtc.UtcDateTime.ToString("O"));

        await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
    }

    public async Task<TimeSpan?> GetLastPositionAsync(string mediaItemId)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "SELECT last_position_ms FROM media_item WHERE id=$id AND deleted=0;";
        cmd.Parameters.AddWithValue("$id", mediaItemId);
        var v = await cmd.ExecuteScalarAsync().ConfigureAwait(false);
        if (v is long ms)
            return TimeSpan.FromMilliseconds(ms);
        return null;
    }

    public async Task<IReadOnlyList<MediaItem>> GetRecentAsync(int limit)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
SELECT id, display_name, source_kind, source_locator, duration_ms
FROM media_item
WHERE deleted=0
ORDER BY last_played_at_utc DESC
LIMIT $limit;
""";
        cmd.Parameters.AddWithValue("$limit", limit);

        var list = new List<MediaItem>();
        await using var reader = await cmd.ExecuteReaderAsync().ConfigureAwait(false);
        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            var id = reader.GetString(0);
            var name = reader.GetString(1);
            var kind = (MediaSourceKind)reader.GetInt32(2);
            var loc = reader.GetString(3);
            TimeSpan? dur = null;
            if (!reader.IsDBNull(4))
                dur = TimeSpan.FromMilliseconds(reader.GetInt64(4));
            list.Add(new MediaItem(id, name, kind, loc, dur));
        }

        return list;
    }
}


