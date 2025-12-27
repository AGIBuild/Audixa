using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Persistence;
using AgiBuild.Audixa.Persistence.Sqlite;
using AgiBuild.Audixa.Stores.Sqlite;
using AgiBuild.Audixa.Tests.TestSupport;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class SqliteSecureSecretStoreTests
{
    [Fact]
    public async Task Upsert_ThenTryGet_RoundTripsPlaintext()
    {
        using var db = new TempFileSqliteDatabase();
        new SqliteDatabaseInitializer(db).Initialize();

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var store = new SqliteSecureSecretStore(db, new XorProtector(), time);

        var id = await store.UpsertAsync("smb-password", "p@ssw0rd!");
        var val = await store.TryGetAsync(id);

        Assert.Equal("p@ssw0rd!", val);
    }

    [Fact]
    public async Task Delete_RemovesSecret()
    {
        using var db = new TempFileSqliteDatabase();
        new SqliteDatabaseInitializer(db).Initialize();

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var store = new SqliteSecureSecretStore(db, new XorProtector(), time);

        var id = await store.UpsertAsync("smb-password", "abc");
        await store.DeleteAsync(id);

        var val = await store.TryGetAsync(id);
        Assert.Null(val);
    }

    private sealed class XorProtector : ISecretProtector
    {
        public byte[] Protect(ReadOnlySpan<byte> plaintext) => Xor(plaintext);
        public byte[] Unprotect(ReadOnlySpan<byte> protectedData) => Xor(protectedData);

        private static byte[] Xor(ReadOnlySpan<byte> input)
        {
            var b = input.ToArray();
            for (var i = 0; i < b.Length; i++)
                b[i] ^= 0xA5;
            return b;
        }
    }
}


