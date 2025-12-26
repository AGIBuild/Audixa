using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Services.Impl;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.Tests.TestSupport;
using AgiBuild.Audixa.ViewModels;
using Xunit;

namespace AgiBuild.Audixa.Tests.ViewModelTests;

public sealed class LearningViewModelTests
{
    [Fact]
    public async Task Initialization_PopulatesCountsAndLists()
    {
        var store = new FakeLearningStore
        {
            SavedSentenceCount = 2,
            VocabularyCount = 3,
            SavedSentences = new List<SavedSentence>
            {
                new("s1", "m1", TimeSpan.Zero, TimeSpan.FromSeconds(1), "p1", "s1", DateTimeOffset.UtcNow, false)
            },
            Vocabulary = new List<VocabularyItem>
            {
                new("v1", "word", null, null, DateTimeOffset.UtcNow, false)
            }
        };
        var notifications = new FakeNotifications();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LearningViewModel(store, notifications, time);
        await vm.Initialization;

        Assert.Equal(2, vm.SavedSentenceCount);
        Assert.Equal(3, vm.VocabularyCount);
        Assert.Single(vm.RecentSavedSentences);
        Assert.Single(vm.SavedSentences);
        Assert.Single(vm.VocabularyItems);
    }

    [Fact]
    public async Task AddWord_AddsVocabulary_ResetsInput_AndShowsToast()
    {
        var store = new FakeLearningStore();
        var notifications = new FakeNotifications();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LearningViewModel(store, notifications, time);
        await vm.Initialization;

        vm.NewWord = " test ";
        await vm.AddWordCommand.ExecuteAsync(null);

        Assert.Equal(1, store.AddVocabularyCalls);
        Assert.Equal("test", store.LastAddedWord);
        Assert.Equal(string.Empty, vm.NewWord);
        Assert.Equal("Added", notifications.LastToast?.Title);
    }

    private sealed class FakeNotifications : INotificationService
    {
        public event EventHandler<ToastNotification>? ToastRaised;
        public event EventHandler<string>? TopAlertRaised;

        public ToastNotification? LastToast { get; private set; }

        public void ShowToast(string title, string message)
        {
            LastToast = new ToastNotification(title, message);
            ToastRaised?.Invoke(this, LastToast);
        }

        public void ShowTopAlert(string message) => TopAlertRaised?.Invoke(this, message);
    }

    private sealed class FakeLearningStore : ILearningStore
    {
        public int SavedSentenceCount { get; set; }
        public int VocabularyCount { get; set; }
        public List<SavedSentence> SavedSentences { get; set; } = new();
        public List<VocabularyItem> Vocabulary { get; set; } = new();

        public int AddVocabularyCalls { get; private set; }
        public string? LastAddedWord { get; private set; }

        public Task AddSavedSentenceAsync(SavedSentence sentence)
        {
            SavedSentences.Insert(0, sentence);
            return Task.CompletedTask;
        }

        public Task AddVocabularyAsync(VocabularyItem item)
        {
            AddVocabularyCalls++;
            LastAddedWord = item.Word;
            Vocabulary.Insert(0, item);
            return Task.CompletedTask;
        }

        public Task<int> GetSavedSentenceCountAsync() => Task.FromResult(SavedSentenceCount);
        public Task<int> GetVocabularyCountAsync() => Task.FromResult(VocabularyCount);

        public Task<IReadOnlyList<SavedSentence>> GetSavedSentencesAsync(int limit)
            => Task.FromResult<IReadOnlyList<SavedSentence>>(SavedSentences.GetRange(0, Math.Min(limit, SavedSentences.Count)));

        public Task<IReadOnlyList<VocabularyItem>> GetVocabularyAsync(int limit)
            => Task.FromResult<IReadOnlyList<VocabularyItem>>(Vocabulary.GetRange(0, Math.Min(limit, Vocabulary.Count)));
    }
}


