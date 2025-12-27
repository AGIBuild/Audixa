using System;
using System.Text;
using System.Threading.Tasks;
using AgiBuild.Audixa.Infrastructure;
using AgiBuild.Audixa.Persistence;

namespace AgiBuild.Audixa.Stores.Sqlite;

public sealed class SqliteSecureSecretStore : ISecureSecretStore
{
    private readonly IAudixaDatabase _db;
    private readonly ISecretProtector _protector;
    private readonly TimeProvider _timeProvider;

    public SqliteSecureSecretStore(IAudixaDatabase db, ISecretProtector protector, TimeProvider timeProvider)
    {
        _db = db;
        _protector = protector;
        _timeProvider = timeProvider;
    }

    public async Task<string> UpsertAsync(string purpose, string plaintext, string? secretId = null)
    {
        if (string.IsNullOrWhiteSpace(purpose))
            throw new ArgumentException("Purpose is required.", nameof(purpose));

        secretId ??= Guid.NewGuid().ToString("N");
        var bytes = Encoding.UTF8.GetBytes(plaintext ?? string.Empty);
        var cipher = _protector.Protect(bytes);

        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
INSERT INTO secret (id, purpose, cipher, updated_at_utc)
VALUES ($id, $purpose, $cipher, $updated)
ON CONFLICT(id) DO UPDATE SET
  purpose=excluded.purpose,
  cipher=excluded.cipher,
  updated_at_utc=excluded.updated_at_utc;
""";
        cmd.Parameters.AddWithValue("$id", secretId);
        cmd.Parameters.AddWithValue("$purpose", purpose);
        cmd.Parameters.AddWithValue("$cipher", cipher);
        cmd.Parameters.AddWithValue("$updated", _timeProvider.GetUtcNow().UtcDateTime.ToString("O"));

        await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
        return secretId;
    }

    public async Task<string?> TryGetAsync(string secretId)
    {
        if (string.IsNullOrWhiteSpace(secretId))
            return null;

        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = """
SELECT cipher
FROM secret
WHERE id=$id;
""";
        cmd.Parameters.AddWithValue("$id", secretId);

        await using var reader = await cmd.ExecuteReaderAsync().ConfigureAwait(false);
        if (!await reader.ReadAsync().ConfigureAwait(false))
            return null;

        var cipher = (byte[])reader["cipher"];
        var plain = _protector.Unprotect(cipher);
        return Encoding.UTF8.GetString(plain);
    }

    public async Task DeleteAsync(string secretId)
    {
        if (string.IsNullOrWhiteSpace(secretId))
            return;

        await using var conn = _db.OpenConnection();
        await using var cmd = conn.CreateCommand();
        cmd.CommandText = "DELETE FROM secret WHERE id=$id;";
        cmd.Parameters.AddWithValue("$id", secretId);
        await cmd.ExecuteNonQueryAsync().ConfigureAwait(false);
    }
}


