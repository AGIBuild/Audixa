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
SELECT id, name, root_path, updated_at_utc, deleted,
       host, share, username, domain, secret_id
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
                Deleted: reader.GetInt64(4) != 0,
                Host: reader.IsDBNull(5) ? null : reader.GetString(5),
                Share: reader.IsDBNull(6) ? null : reader.GetString(6),
                Username: reader.IsDBNull(7) ? null : reader.GetString(7),
                Domain: reader.IsDBNull(8) ? null : reader.GetString(8),
                SecretId: reader.IsDBNull(9) ? null : reader.GetString(9)));
        }

        return list;
    }

    public async Task<SmbProfile?> TryGetByIdAsync(string id)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
SELECT id, name, root_path, updated_at_utc, deleted,
       host, share, username, domain, secret_id
FROM smb_profile
WHERE id=$id
LIMIT 1;
""";
        cmd.Parameters.AddWithValue("$id", id);

        await using var reader = await cmd.ExecuteReaderAsync().ConfigureAwait(false);
        if (!await reader.ReadAsync().ConfigureAwait(false))
            return null;

        return new SmbProfile(
            Id: reader.GetString(0),
            Name: reader.GetString(1),
            RootPath: reader.GetString(2),
            UpdatedAtUtc: DateTimeOffset.Parse(reader.GetString(3)),
            Deleted: reader.GetInt64(4) != 0,
            Host: reader.IsDBNull(5) ? null : reader.GetString(5),
            Share: reader.IsDBNull(6) ? null : reader.GetString(6),
            Username: reader.IsDBNull(7) ? null : reader.GetString(7),
            Domain: reader.IsDBNull(8) ? null : reader.GetString(8),
            SecretId: reader.IsDBNull(9) ? null : reader.GetString(9));
    }

    public async Task UpsertAsync(SmbProfile profile)
    {
        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
INSERT INTO smb_profile (id, name, root_path, updated_at_utc, deleted, host, share, username, domain, secret_id)
VALUES ($id, $name, $root, $updated, $deleted, $host, $share, $username, $domain, $secretId)
ON CONFLICT(id) DO UPDATE SET
  name=excluded.name,
  root_path=excluded.root_path,
  updated_at_utc=excluded.updated_at_utc,
  deleted=excluded.deleted,
  host=excluded.host,
  share=excluded.share,
  username=excluded.username,
  domain=excluded.domain,
  secret_id=excluded.secret_id;
""";
        cmd.Parameters.AddWithValue("$id", profile.Id);
        cmd.Parameters.AddWithValue("$name", profile.Name);
        cmd.Parameters.AddWithValue("$root", profile.RootPath);
        cmd.Parameters.AddWithValue("$updated", profile.UpdatedAtUtc.UtcDateTime.ToString("O"));
        cmd.Parameters.AddWithValue("$deleted", profile.Deleted ? 1 : 0);
        cmd.Parameters.AddWithValue("$host", (object?)profile.Host ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$share", (object?)profile.Share ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$username", (object?)profile.Username ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$domain", (object?)profile.Domain ?? DBNull.Value);
        cmd.Parameters.AddWithValue("$secretId", (object?)profile.SecretId ?? DBNull.Value);

        await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
}


