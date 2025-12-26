using System;
using System.Linq;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Persistence.Sqlite;
using AgiBuild.Audixa.Stores.Sqlite;
using AgiBuild.Audixa.Tests.TestSupport;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class SqliteLibraryStoreTests
{
    [Fact]
    public async Task UpsertMedia_ThenGetRecent_ReturnsItem()
    {
        using var db = new TempFileSqliteDatabase();
        new SqliteDatabaseInitializer(db).Initialize();

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var store = new SqliteLibraryStore(db, time);

        var item = new MediaItem(
            Id: "m1",
            DisplayName: "a.mp4",
            SourceKind: MediaSourceKind.Local,
            SourceLocator: "file:///a.mp4",
            Duration: TimeSpan.FromSeconds(10));

        await store.UpsertMediaAsync(item, time.GetUtcNow());

        var recent = await store.GetRecentAsync(10);

        Assert.Single(recent);
        Assert.Equal("m1", recent[0].Id);
        Assert.Equal(TimeSpan.FromSeconds(10), recent[0].Duration);
    }

    [Fact]
    public async Task SaveProgress_ThenGetLastPosition_ReturnsSavedPosition()
    {
        using var db = new TempFileSqliteDatabase();
        new SqliteDatabaseInitializer(db).Initialize();

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var store = new SqliteLibraryStore(db, time);

        var item = new MediaItem("m1", "a.mp4", MediaSourceKind.Local, "file:///a.mp4", null);
        await store.UpsertMediaAsync(item, time.GetUtcNow());

        await store.SaveProgressAsync("m1", TimeSpan.FromSeconds(12.3), time.GetUtcNow());

        var pos = await store.GetLastPositionAsync("m1");
        Assert.Equal(TimeSpan.FromSeconds(12.3), pos);
    }
}


