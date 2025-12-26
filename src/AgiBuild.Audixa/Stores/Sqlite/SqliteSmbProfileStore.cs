using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Persistence;

namespace AgiBuild.Audixa.Stores.Sqlite;

public sealed class SqliteSmbProfileStore : ISmbProfileStore
{
    private readonly IAudixaDatabase _db;

    public SqliteSmbProfileStore(IAudixaDatabase db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<SmbProfile>> GetAllAsync()
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
SELECT id, name, root_path, updated_at_utc, deleted
FROM smb_profile
WHERE deleted=0
ORDER BY updated_at_utc DESC;
""";

        var list = new List<SmbProfile>();
        await using var reader = await cmd.ExecuteReaderAsync().ConfigureAwait(false);
        while (await reader.ReadAsync().ConfigureAwait(false))
        {
            list.Add(new SmbProfile(
                Id: reader.GetString(0),
                Name: reader.GetString(1),
                RootPath: reader.GetString(2),
                UpdatedAtUtc: DateTimeOffset.Parse(reader.GetString(3)),
                Deleted: reader.GetInt64(4) != 0));
        }

        return list;
    }

    public async Task UpsertAsync(SmbProfile profile)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
INSERT INTO smb_profile (id, name, root_path, updated_at_utc, deleted)
VALUES ($id, $name, $root, $updated, $deleted)
ON CONFLICT(id) DO UPDATE SET
  name=excluded.name,
  root_path=excluded.root_path,
  updated_at_utc=excluded.updated_at_utc,
  deleted=excluded.deleted;
""";
        cmd.Parameters.AddWithValue("$id", profile.Id);
        cmd.Parameters.AddWithValue("$name", profile.Name);
        cmd.Parameters.AddWithValue("$root", profile.RootPath);
        cmd.Parameters.AddWithValue("$updated", profile.UpdatedAtUtc.UtcDateTime.ToString("O"));
        cmd.Parameters.AddWithValue("$deleted", profile.Deleted ? 1 : 0);

        await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
}


