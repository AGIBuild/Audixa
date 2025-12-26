using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Persistence.Sqlite;
using AgiBuild.Audixa.Stores.Sqlite;
using AgiBuild.Audixa.Tests.TestSupport;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class SqliteLearningStoreTests
{
    [Fact]
    public async Task AddSavedSentence_ThenCountAndList_ReturnsInserted()
    {
        using var db = new TempFileSqliteDatabase();
        new SqliteDatabaseInitializer(db).Initialize();

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var store = new SqliteLearningStore(db, time);

        var sentence = new SavedSentence(
            Id: "s1",
            MediaItemId: "m1",
            Start: TimeSpan.FromSeconds(1),
            End: TimeSpan.FromSeconds(2),
            PrimaryText: "hello",
            SecondaryText: "你好",
            UpdatedAtUtc: time.GetUtcNow(),
            Deleted: false);

        await store.AddSavedSentenceAsync(sentence);

        Assert.Equal(1, await store.GetSavedSentenceCountAsync());

        var list = await store.GetSavedSentencesAsync(10);
        Assert.Single(list);
        Assert.Equal("s1", list[0].Id);
        Assert.Equal("hello", list[0].PrimaryText);
        Assert.Equal("你好", list[0].SecondaryText);
    }

    [Fact]
    public async Task AddVocabulary_ThenCountAndList_ReturnsInserted()
    {
        using var db = new TempFileSqliteDatabase();
        new SqliteDatabaseInitializer(db).Initialize();

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var store = new SqliteLearningStore(db, time);

        var word = new VocabularyItem(
            Id: "v1",
            Word: "test",
            Context: "ctx",
            SourceMediaItemId: null,
            UpdatedAtUtc: time.GetUtcNow(),
            Deleted: false);

        await store.AddVocabularyAsync(word);

        Assert.Equal(1, await store.GetVocabularyCountAsync());

        var list = await store.GetVocabularyAsync(10);
        Assert.Single(list);
        Assert.Equal("v1", list[0].Id);
        Assert.Equal("test", list[0].Word);
    }
}


