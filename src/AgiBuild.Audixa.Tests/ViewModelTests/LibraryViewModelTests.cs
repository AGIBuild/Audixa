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
        var smbBrowser = new FakeSmbBrowser();
        var smbPlayback = new FakeSmbPlaybackLocator();
        var secrets = new FakeSecureSecretStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LibraryViewModel(
            libraryStore: new FakeLibraryStore(),
            notifications: notifications,
            localSource: localSource,
            playback: playback,
            smbProfiles: smbStore,
            smbBrowser: smbBrowser,
            smbPlayback: smbPlayback,
            secrets: secrets,
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
                new SmbProfile("p1", "p1", $"smb://server/share", DateTimeOffset.UtcNow, false, Host: "server", Share: "share"),
            });

            var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
            var smbBrowser = new FakeSmbBrowser
            {
                ItemsToReturn = new[]
                {
                    new SmbBrowseEntry("a.mp4", false),
                    new SmbBrowseEntry("folder", true),
                },
            };
            var smbPlayback = new FakeSmbPlaybackLocator();
            var secrets = new FakeSecureSecretStore();

            var vm = new LibraryViewModel(
                libraryStore: new FakeLibraryStore(),
                notifications: notifications,
                localSource: localSource,
                playback: playback,
                smbProfiles: smbStore,
                smbBrowser: smbBrowser,
                smbPlayback: smbPlayback,
                secrets: secrets,
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

    [Fact]
    public async Task BrowseSmb_NonRoot_IncludesUpEntry()
    {
        var playback = new FakePlayback();
        var notifications = new FakeNotifications();
        var localSource = new FakeSourceProvider(null);

        var profile = new SmbProfile(
            Id: "p1",
            Name: "p1",
            RootPath: "smb://server/share",
            UpdatedAtUtc: DateTimeOffset.UtcNow,
            Deleted: false,
            Host: "server",
            Share: "share");

        var smbStore = new FakeSmbProfileStore(new[] { profile });

        var smbBrowser = new FakeSmbBrowser
        {
            ItemsToReturn = new[]
            {
                new SmbBrowseEntry("inner.mp4", false),
            },
        };

        var smbPlayback = new FakeSmbPlaybackLocator();
        var secrets = new FakeSecureSecretStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LibraryViewModel(
            libraryStore: new FakeLibraryStore(),
            notifications: notifications,
            localSource: localSource,
            playback: playback,
            smbProfiles: smbStore,
            smbBrowser: smbBrowser,
            smbPlayback: smbPlayback,
            secrets: secrets,
            logger: NullLogger<LibraryViewModel>.Instance,
            timeProvider: time);

        await vm.Initialization;

        // Start at root, then enter a folder.
        await vm.BrowseSmbCommand.ExecuteAsync(null);
        await vm.OpenSmbEntryCommand.ExecuteAsync(new LibraryViewModel.SmbEntryViewModel(
            Name: "folder",
            FullPath: "folder",
            IsDirectory: true,
            OpenCommand: vm.OpenSmbEntryCommand));

        Assert.Contains(vm.SmbEntries, e => e.Name == ".." && e.IsDirectory);
    }

    [Fact]
    public async Task RefreshRecents_PopulatesRecentItems()
    {
        var playback = new FakePlayback();
        var notifications = new FakeNotifications();
        var localSource = new FakeSourceProvider(null);
        var smbStore = new FakeSmbProfileStore(Array.Empty<SmbProfile>());
        var smbBrowser = new FakeSmbBrowser();
        var smbPlayback = new FakeSmbPlaybackLocator();
        var secrets = new FakeSecureSecretStore();

        var recent1 = new MediaItem("r1", "r1.mp4", MediaSourceKind.Local, "file:///r1.mp4", null);
        var recent2 = new MediaItem("r2", "r2.mp4", MediaSourceKind.Local, "file:///r2.mp4", null);
        var libraryStore = new FakeLibraryStore { RecentToReturn = new[] { recent1, recent2 } };

        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var vm = new LibraryViewModel(
            libraryStore: libraryStore,
            notifications: notifications,
            localSource: localSource,
            playback: playback,
            smbProfiles: smbStore,
            smbBrowser: smbBrowser,
            smbPlayback: smbPlayback,
            secrets: secrets,
            logger: NullLogger<LibraryViewModel>.Instance,
            timeProvider: time);

        await vm.Initialization;

        Assert.Equal(2, vm.RecentItems.Count);
        Assert.Equal(1, libraryStore.GetRecentCalls);
        Assert.Equal("r1", vm.RecentItems[0].Id);
        Assert.Equal("r2", vm.RecentItems[1].Id);
    }

    [Fact]
    public async Task OpenRecent_UsesDirectUriPlaybackInput_AndShowsToast()
    {
        var playback = new FakePlayback();
        var notifications = new FakeNotifications();
        var localSource = new FakeSourceProvider(null);
        var smbStore = new FakeSmbProfileStore(Array.Empty<SmbProfile>());
        var smbBrowser = new FakeSmbBrowser();
        var smbPlayback = new FakeSmbPlaybackLocator();
        var secrets = new FakeSecureSecretStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LibraryViewModel(
            libraryStore: new FakeLibraryStore(),
            notifications: notifications,
            localSource: localSource,
            playback: playback,
            smbProfiles: smbStore,
            smbBrowser: smbBrowser,
            smbPlayback: smbPlayback,
            secrets: secrets,
            logger: NullLogger<LibraryViewModel>.Instance,
            timeProvider: time);

        await vm.Initialization;

        var item = new MediaItem("r1", "r1.mp4", MediaSourceKind.Local, "file:///r1.mp4", null);
        vm.OpenRecentCommand.Execute(item);

        Assert.Equal(1, playback.OpenCalls);
        Assert.Equal("r1", playback.LastOpenedItem?.Id);
        Assert.Equal("file:///r1.mp4", ((DirectUriPlaybackInput)playback.LastInput!).Uri.ToString());
        Assert.Equal("Opened", notifications.LastToast?.Title);
    }

    [Fact]
    public async Task OpenRecent_SmbWithProfileId_LooksUpProfile_AndOpensPlaybackUri()
    {
        var playback = new FakePlayback();
        var notifications = new FakeNotifications();
        var localSource = new FakeSourceProvider(null);

        var profile = new SmbProfile(
            Id: "p1",
            Name: "p1",
            RootPath: "smb://server/share",
            UpdatedAtUtc: DateTimeOffset.UtcNow,
            Deleted: false,
            Host: "server",
            Share: "share",
            Username: "u",
            Domain: "d",
            SecretId: "sid");

        var smbStore = new FakeSmbProfileStore(new[] { profile });
        var smbBrowser = new FakeSmbBrowser();
        var smbPlayback = new FakeSmbPlaybackLocator();
        var secrets = new FakeSecureSecretStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LibraryViewModel(
            libraryStore: new FakeLibraryStore(),
            notifications: notifications,
            localSource: localSource,
            playback: playback,
            smbProfiles: smbStore,
            smbBrowser: smbBrowser,
            smbPlayback: smbPlayback,
            secrets: secrets,
            logger: NullLogger<LibraryViewModel>.Instance,
            timeProvider: time);

        await vm.Initialization;

        var recent = new MediaItem(
            Id: "m1",
            DisplayName: "a.mp4",
            SourceKind: MediaSourceKind.Smb,
            SourceLocator: "smb://server/share/folder/a.mp4?profileId=p1",
            Duration: null);

        vm.OpenRecentCommand.Execute(recent);

        for (var i = 0; i < 50 && playback.OpenCalls == 0; i++)
            await Task.Delay(5);

        Assert.Equal(1, playback.OpenCalls);
        Assert.Equal("Opened", notifications.LastToast?.Title);
        Assert.StartsWith("smb://server/share/", ((DirectUriPlaybackInput)playback.LastInput!).Uri.ToString());
        Assert.DoesNotContain("profileId=", ((DirectUriPlaybackInput)playback.LastInput!).Uri.ToString());
    }

    [Fact]
    public async Task PlaybackMediaOpened_RefreshesRecents()
    {
        var playback = new FakePlayback();
        var notifications = new FakeNotifications();
        var localSource = new FakeSourceProvider(null);
        var smbStore = new FakeSmbProfileStore(Array.Empty<SmbProfile>());
        var libraryStore = new FakeLibraryStore { RecentToReturn = Array.Empty<MediaItem>() };
        var smbBrowser = new FakeSmbBrowser();
        var smbPlayback = new FakeSmbPlaybackLocator();
        var secrets = new FakeSecureSecretStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var vm = new LibraryViewModel(
            libraryStore: libraryStore,
            notifications: notifications,
            localSource: localSource,
            playback: playback,
            smbProfiles: smbStore,
            smbBrowser: smbBrowser,
            smbPlayback: smbPlayback,
            secrets: secrets,
            logger: NullLogger<LibraryViewModel>.Instance,
            timeProvider: time);

        await vm.Initialization;
        Assert.Equal(1, libraryStore.GetRecentCalls);
        Assert.Empty(vm.RecentItems);

        libraryStore.RecentToReturn = new[]
        {
            new MediaItem("r9", "r9.mp4", MediaSourceKind.Local, "file:///r9.mp4", null),
        };

        playback.Open(new MediaItem("x", "x.mp4", MediaSourceKind.Local, "file:///x.mp4", null), new DirectUriPlaybackInput(new Uri("file:///x.mp4")));

        // MediaOpened handler is fire-and-forget.
        for (var i = 0; i < 50 && vm.RecentItems.Count == 0; i++)
            await Task.Delay(5);

        Assert.Equal(2, libraryStore.GetRecentCalls);
        Assert.Single(vm.RecentItems);
        Assert.Equal("r9", vm.RecentItems[0].Id);
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
        public MediaItem? LastOpenedItem { get; private set; }
        public PlaybackInput? LastInput { get; private set; }

        public void Play() { }
        public void Pause() { }
        public void Seek(TimeSpan position) { }
        public void SetSpeed(double speed) { }

        public void Open(MediaItem item, PlaybackInput input)
        {
            OpenCalls++;
            LastOpenedItem = item;
            LastInput = input;
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
        public IReadOnlyList<MediaItem> RecentToReturn { get; set; } = Array.Empty<MediaItem>();
        public int GetRecentCalls { get; private set; }

        public Task UpsertMediaAsync(MediaItem item, DateTimeOffset playedAtUtc) => Task.CompletedTask;
        public Task SaveProgressAsync(string mediaItemId, TimeSpan position, DateTimeOffset updatedAtUtc) => Task.CompletedTask;
        public Task<TimeSpan?> GetLastPositionAsync(string mediaItemId) => Task.FromResult<TimeSpan?>(null);
        public Task<IReadOnlyList<MediaItem>> GetRecentAsync(int limit)
        {
            GetRecentCalls++;
            return Task.FromResult(RecentToReturn);
        }
    }

    private sealed class FakeSmbProfileStore : ISmbProfileStore
    {
        private readonly IReadOnlyList<SmbProfile> _profiles;

        public FakeSmbProfileStore(IReadOnlyList<SmbProfile> profiles) => _profiles = profiles;

        public Task<IReadOnlyList<SmbProfile>> GetAllAsync() => Task.FromResult(_profiles);
        public Task<SmbProfile?> TryGetByIdAsync(string id) =>
            Task.FromResult(_profiles.FirstOrDefault(p => p.Id == id));
        public Task UpsertAsync(SmbProfile profile) => Task.CompletedTask;
    }

    private sealed class FakeSmbBrowser : ISmbBrowser
    {
        public IReadOnlyList<SmbBrowseEntry> ItemsToReturn { get; set; } = Array.Empty<SmbBrowseEntry>();
        public Task<IReadOnlyList<SmbBrowseEntry>> ListAsync(SmbBrowseRequest request, System.Threading.CancellationToken ct = default) =>
            Task.FromResult(ItemsToReturn);
    }

    private sealed class FakeSmbPlaybackLocator : ISmbPlaybackLocator
    {
        public Uri CreatePlaybackUri(string host, string share, string relativePath, SmbProfile profile) =>
            new Uri($"smb://{host}/{share}/{SmbPath.NormalizeRelativePath(relativePath).Replace("\\", "/")}");
    }

    private sealed class FakeSecureSecretStore : ISecureSecretStore
    {
        public Task<string> UpsertAsync(string purpose, string plaintext, string? secretId = null) =>
            Task.FromResult(secretId ?? "sid");
        public Task<string?> TryGetAsync(string secretId) => Task.FromResult<string?>("pw");
        public Task DeleteAsync(string secretId) => Task.CompletedTask;
    }
}


