using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.Sources;
using AgiBuild.Audixa.Tests.TestSupport;
using AgiBuild.Audixa.ViewModels;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AgiBuild.Audixa.Tests.ViewModelTests;

public sealed class LibraryViewModelTests
{
    [Fact]
    public async Task OpenLocalMp4_OpensPlaybackAndShowsToast()
    {
        var playback = new FakePlayback();
        var notifications = new FakeNotifications();
        var localSource = new FakeSourceProvider(new MediaOpenRequest(
            new MediaItem("m1", "a.mp4", MediaSourceKind.Local, "file:///a.mp4", null),
            new DirectUriPlaybackInput(new Uri("file:///a.mp4"))));

        var smbStore = new FakeSmbProfileStore(Array.Empty<SmbProfile>());
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LibraryViewModel(
            libraryStore: new FakeLibraryStore(),
            notifications: notifications,
            localSource: localSource,
            playback: playback,
            smbProfiles: smbStore,
            logger: NullLogger<LibraryViewModel>.Instance,
            timeProvider: time);

        await vm.Initialization;

        await vm.OpenLocalMp4Command.ExecuteAsync(null);

        Assert.Equal(1, playback.OpenCalls);
        Assert.Equal("Opened", notifications.LastToast?.Title);
    }

    [Fact]
    public async Task BrowseSmb_PopulatesEntries_AndOpenMp4OpensPlayback()
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "AudixaTests", Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        try
        {
            var filePath = Path.Combine(tempDir, "a.mp4");
            await File.WriteAllBytesAsync(filePath, new byte[] { 0, 1, 2 });
            Directory.CreateDirectory(Path.Combine(tempDir, "folder"));

            var playback = new FakePlayback();
            var notifications = new FakeNotifications();
            var localSource = new FakeSourceProvider(null);

            var smbStore = new FakeSmbProfileStore(new[]
            {
                new SmbProfile("p1", "p1", tempDir, DateTimeOffset.UtcNow, false),
            });

            var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

            var vm = new LibraryViewModel(
                libraryStore: new FakeLibraryStore(),
                notifications: notifications,
                localSource: localSource,
                playback: playback,
                smbProfiles: smbStore,
                logger: NullLogger<LibraryViewModel>.Instance,
                timeProvider: time);

            await vm.Initialization;

            await vm.BrowseSmbCommand.ExecuteAsync(null);

            Assert.True(vm.SmbEntries.Count >= 2);
            Assert.Contains(vm.SmbEntries, e => e.Name == "a.mp4" && !e.IsDirectory);
            Assert.Contains(vm.SmbEntries, e => e.Name == "folder" && e.IsDirectory);

            var mp4 = vm.SmbEntries.First(e => e.Name == "a.mp4");
            await vm.OpenSmbEntryCommand.ExecuteAsync(mp4);

            Assert.Equal(1, playback.OpenCalls);
        }
        finally
        {
            try { Directory.Delete(tempDir, recursive: true); } catch { /* ignore */ }
        }
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

    private sealed class FakePlayback : IPlaybackService
    {
        public PlaybackState State { get; } = new();
        public event EventHandler<MediaItem>? MediaOpened;

        public int OpenCalls { get; private set; }

        public void Play() { }
        public void Pause() { }
        public void Seek(TimeSpan position) { }
        public void SetSpeed(double speed) { }

        public void Open(MediaItem item, PlaybackInput input)
        {
            OpenCalls++;
            MediaOpened?.Invoke(this, item);
        }
    }

    private sealed class FakeSourceProvider : ISourceProvider
    {
        private readonly MediaOpenRequest? _req;

        public FakeSourceProvider(MediaOpenRequest? req) => _req = req;

        public string Id => "fake";
        public string DisplayName => "fake";

        public Task<MediaOpenRequest?> PickSingleAsync() => Task.FromResult(_req);
    }

    private sealed class FakeLibraryStore : ILibraryStore
    {
        public Task UpsertMediaAsync(MediaItem item, DateTimeOffset playedAtUtc) => Task.CompletedTask;
        public Task SaveProgressAsync(string mediaItemId, TimeSpan position, DateTimeOffset updatedAtUtc) => Task.CompletedTask;
        public Task<TimeSpan?> GetLastPositionAsync(string mediaItemId) => Task.FromResult<TimeSpan?>(null);
        public Task<IReadOnlyList<MediaItem>> GetRecentAsync(int limit) => Task.FromResult<IReadOnlyList<MediaItem>>(Array.Empty<MediaItem>());
    }

    private sealed class FakeSmbProfileStore : ISmbProfileStore
    {
        private readonly IReadOnlyList<SmbProfile> _profiles;

        public FakeSmbProfileStore(IReadOnlyList<SmbProfile> profiles) => _profiles = profiles;

        public Task<IReadOnlyList<SmbProfile>> GetAllAsync() => Task.FromResult(_profiles);
        public Task UpsertAsync(SmbProfile profile) => Task.CompletedTask;
    }
}


