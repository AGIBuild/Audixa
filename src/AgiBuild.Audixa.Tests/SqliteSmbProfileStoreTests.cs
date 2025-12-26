using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Persistence.Sqlite;
using AgiBuild.Audixa.Stores.Sqlite;
using AgiBuild.Audixa.Tests.TestSupport;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class SqliteSmbProfileStoreTests
{
    [Fact]
    public async Task Upsert_ThenGetAll_ReturnsProfile()
    {
        using var db = new TempFileSqliteDatabase();
        new SqliteDatabaseInitializer(db).Initialize();

        var store = new SqliteSmbProfileStore(db);

        var profile = new SmbProfile(
            Id: "p1",
            Name: "root",
            RootPath: @"\\server\share",
            UpdatedAtUtc: new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero),
            Deleted: false);

        await store.UpsertAsync(profile);

        var list = await store.GetAllAsync();
        Assert.Single(list);
        Assert.Equal("p1", list[0].Id);
        Assert.Equal(@"\\server\share", list[0].RootPath);
    }
}


