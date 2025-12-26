using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Presentation.Video;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Services.Impl;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.Sources;
using AgiBuild.Audixa.Tests.TestSupport;
using AgiBuild.Audixa.ViewModels;
using Avalonia.Controls;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AgiBuild.Audixa.Tests.ViewModelTests;

public sealed class ShellViewModelTests
{
    [Fact]
    public async Task Ctor_DefaultsToLibraryPage_AndMediaOpenedNavigatesToPlayer()
    {
        var playback = new FakePlaybackService();

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var notificationService = new NotificationService();
        var notificationHost = new NotificationHostViewModel(notificationService);

        var library = new LibraryViewModel(
            libraryStore: new FakeLibraryStore(),
            notifications: notificationService,
            localSource: new FakeSourceProvider(),
            playback: playback,
            smbProfiles: new FakeSmbProfileStore(),
            logger: NullLogger<LibraryViewModel>.Instance,
            timeProvider: time);
        await library.Initialization;

        var player = new PlayerViewModel(
            playback: playback,
            videoSurfaceFactory: new FakeVideoSurfaceFactory(),
            subtitles: new SubtitleService(),
            subtitlePicker: new FakeSubtitlePicker(),
            learningStore: new FakeLearningStore(),
            notifications: notificationService,
            timeProvider: time);

        var learning = new LearningViewModel(
            learningStore: new FakeLearningStore(),
            notifications: notificationService,
            timeProvider: time);
        await learning.Initialization;

        var mini = new MiniPlayerViewModel(playback);

        var shell = new ShellViewModel(
            library: library,
            player: player,
            learning: learning,
            notifications: notificationHost,
            miniPlayer: mini,
            playbackService: playback);

        Assert.Same(library, shell.CurrentPage);

        playback.RaiseMediaOpened(new MediaItem("m1", "x", MediaSourceKind.Local, "file:///x", null));

        Assert.Same(player, shell.CurrentPage);
    }

    private sealed class FakePlaybackService : IPlaybackService
    {
        public PlaybackState State { get; } = new();
        public event EventHandler<MediaItem>? MediaOpened;

        public void Play() { }
        public void Pause() { }
        public void Seek(TimeSpan position) { }
        public void SetSpeed(double speed) { }
        public void Open(MediaItem item, PlaybackInput input) => MediaOpened?.Invoke(this, item);

        public void RaiseMediaOpened(Domain.MediaItem item) => MediaOpened?.Invoke(this, item);
    }

    private sealed class FakeVideoSurfaceFactory : IVideoSurfaceFactory
    {
        public Control Create() => new Border();
    }

    private sealed class FakeSubtitlePicker : ILocalSubtitlePicker
    {
        public Task<Uri?> PickSubtitleAsync() => Task.FromResult<Uri?>(null);
    }

    private sealed class FakeLibraryStore : ILibraryStore
    {
        public Task UpsertMediaAsync(MediaItem item, DateTimeOffset playedAtUtc) => Task.CompletedTask;
        public Task SaveProgressAsync(string mediaItemId, TimeSpan position, DateTimeOffset updatedAtUtc) => Task.CompletedTask;
        public Task<TimeSpan?> GetLastPositionAsync(string mediaItemId) => Task.FromResult<TimeSpan?>(null);
        public Task<IReadOnlyList<MediaItem>> GetRecentAsync(int limit) => Task.FromResult<IReadOnlyList<MediaItem>>(Array.Empty<MediaItem>());
    }

    private sealed class FakeLearningStore : ILearningStore
    {
        public Task AddSavedSentenceAsync(SavedSentence sentence) => Task.CompletedTask;
        public Task AddVocabularyAsync(VocabularyItem item) => Task.CompletedTask;
        public Task<int> GetSavedSentenceCountAsync() => Task.FromResult(0);
        public Task<int> GetVocabularyCountAsync() => Task.FromResult(0);
        public Task<IReadOnlyList<SavedSentence>> GetSavedSentencesAsync(int limit) => Task.FromResult<IReadOnlyList<SavedSentence>>(Array.Empty<SavedSentence>());
        public Task<IReadOnlyList<VocabularyItem>> GetVocabularyAsync(int limit) => Task.FromResult<IReadOnlyList<VocabularyItem>>(Array.Empty<VocabularyItem>());
    }

    private sealed class FakeSourceProvider : ISourceProvider
    {
        public string Id => "fake";
        public string DisplayName => "fake";

        public Task<MediaOpenRequest?> PickSingleAsync() => Task.FromResult<MediaOpenRequest?>(null);
    }

    private sealed class FakeSmbProfileStore : ISmbProfileStore
    {
        public Task<IReadOnlyList<SmbProfile>> GetAllAsync() => Task.FromResult<IReadOnlyList<SmbProfile>>(Array.Empty<SmbProfile>());
        public Task UpsertAsync(SmbProfile profile) => Task.CompletedTask;
    }
}


