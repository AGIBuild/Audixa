using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Services.Impl;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.Tests.TestSupport;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class PlaybackServiceTests
{
    [Fact]
    public void Play_NoMediaLoaded_SetsError()
    {
        var adapter = new FakeAdapter();
        var notifications = new FakeNotifications();
        var store = new FakeLibraryStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var svc = new PlaybackService(adapter, notifications, store, NullLogger<PlaybackService>.Instance, time);

        svc.Play();

        Assert.Equal("No media loaded.", svc.State.ErrorMessage);
        Assert.False(svc.State.IsPlaying);
    }

    [Fact]
    public void Open_ThenPlay_CallsAdapterAndUpdatesState()
    {
        var adapter = new FakeAdapter();
        var notifications = new FakeNotifications();
        var store = new FakeLibraryStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var svc = new PlaybackService(adapter, notifications, store, NullLogger<PlaybackService>.Instance, time);

        var item = new MediaItem("m1", "test.mp4", MediaSourceKind.Local, "file:///test.mp4", null);
        var input = new DirectUriPlaybackInput(new Uri("file:///test.mp4"));

        MediaItem? opened = null;
        svc.MediaOpened += (_, m) => opened = m;

        svc.Open(item, input);
        svc.Play();

        Assert.Same(item, opened);
        Assert.Same(item, svc.State.CurrentItem);
        Assert.True(svc.State.IsPlaying);
        Assert.Same(input, adapter.OpenedInput);
        Assert.Equal(1, adapter.PlayCalls);
        Assert.Equal(1, store.UpsertCalls);
    }

    [Fact]
    public void Pause_WithLoadedMedia_SavesProgress()
    {
        var adapter = new FakeAdapter();
        var notifications = new FakeNotifications();
        var store = new FakeLibraryStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 1, 2, 3, TimeSpan.Zero));

        var svc = new PlaybackService(adapter, notifications, store, NullLogger<PlaybackService>.Instance, time);

        var item = new MediaItem("m1", "test.mp4", MediaSourceKind.Local, "file:///test.mp4", null);
        svc.Open(item, new DirectUriPlaybackInput(new Uri("file:///test.mp4")));

        svc.Seek(TimeSpan.FromSeconds(12));
        svc.Play();
        svc.Pause();

        Assert.False(svc.State.IsPlaying);
        Assert.Equal(1, store.SaveProgressCalls);
        Assert.Equal("m1", store.LastMediaId);
        Assert.Equal(TimeSpan.FromSeconds(12), store.LastPosition);
        Assert.Equal(time.GetUtcNow(), store.LastUpdatedAtUtc);
    }

    [Fact]
    public void AdapterError_RaisesTopAlertAndSetsStateError()
    {
        var adapter = new FakeAdapter();
        var notifications = new FakeNotifications();
        var store = new FakeLibraryStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var svc = new PlaybackService(adapter, notifications, store, NullLogger<PlaybackService>.Instance, time);

        adapter.RaiseError("boom");

        Assert.Equal("boom", svc.State.ErrorMessage);
        Assert.Equal("boom", notifications.LastTopAlert);
    }

    [Fact]
    public void WhilePlaying_PositionUpdates_AutoSavesThrottled()
    {
        var adapter = new FakeAdapter();
        var notifications = new FakeNotifications();
        var store = new FakeLibraryStore();
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

        var svc = new PlaybackService(adapter, notifications, store, NullLogger<PlaybackService>.Instance, time);
        var item = new MediaItem("m1", "test.mp4", MediaSourceKind.Local, "file:///test.mp4", null);
        svc.Open(item, new DirectUriPlaybackInput(new Uri("file:///test.mp4")));
        svc.Play();

        // initial updates should not autosave until min interval elapses
        adapter.RaisePosition(TimeSpan.FromSeconds(1));
        adapter.RaisePosition(TimeSpan.FromSeconds(2));
        Assert.Equal(0, store.SaveProgressCalls);

        // after 10s, first autosave
        time.SetUtcNow(time.GetUtcNow().AddSeconds(10));
        adapter.RaisePosition(TimeSpan.FromSeconds(3));
        Assert.Equal(1, store.SaveProgressCalls);

        // within interval, no additional save
        adapter.RaisePosition(TimeSpan.FromSeconds(5));
        Assert.Equal(1, store.SaveProgressCalls);

        // after another interval, second autosave
        time.SetUtcNow(time.GetUtcNow().AddSeconds(10));
        adapter.RaisePosition(TimeSpan.FromSeconds(6));
        Assert.Equal(2, store.SaveProgressCalls);
    }

    private sealed class FakeAdapter : IMediaPlayerAdapter
    {
        public int PlayCalls { get; private set; }
        public int PauseCalls { get; private set; }
        public int SeekCalls { get; private set; }
        public int SetSpeedCalls { get; private set; }

        public PlaybackInput? OpenedInput { get; private set; }
        public TimeSpan? LastSeek { get; private set; }
        public double? LastSpeed { get; private set; }

        public Avalonia.Controls.Control View { get; } = new Avalonia.Controls.TextBlock { Text = "fake" };

        public event EventHandler<TimeSpan>? PositionChanged;
        public event EventHandler<TimeSpan?>? DurationChanged;
        public event EventHandler<string>? ErrorRaised;

        public void Open(PlaybackInput input) => OpenedInput = input;
        public void Play() => PlayCalls++;
        public void Pause() => PauseCalls++;
        public void Seek(TimeSpan position) { SeekCalls++; LastSeek = position; }
        public void SetSpeed(double speed) { SetSpeedCalls++; LastSpeed = speed; }

        public void RaiseError(string error) => ErrorRaised?.Invoke(this, error);
        public void RaisePosition(TimeSpan pos) => PositionChanged?.Invoke(this, pos);
        public void RaiseDuration(TimeSpan? dur) => DurationChanged?.Invoke(this, dur);
    }

    private sealed class FakeNotifications : INotificationService
    {
        public event EventHandler<ToastNotification>? ToastRaised;
        public event EventHandler<string>? TopAlertRaised;

        public string? LastTopAlert { get; private set; }

        public void ShowToast(string title, string message)
        {
            ToastRaised?.Invoke(this, new ToastNotification(title, message));
        }

        public void ShowTopAlert(string message)
        {
            LastTopAlert = message;
            TopAlertRaised?.Invoke(this, message);
        }
    }

    private sealed class FakeLibraryStore : ILibraryStore
    {
        public int UpsertCalls { get; private set; }
        public int SaveProgressCalls { get; private set; }

        public string? LastMediaId { get; private set; }
        public TimeSpan LastPosition { get; private set; }
        public DateTimeOffset LastUpdatedAtUtc { get; private set; }

        public Task UpsertMediaAsync(MediaItem item, DateTimeOffset playedAtUtc)
        {
            UpsertCalls++;
            return Task.CompletedTask;
        }

        public Task SaveProgressAsync(string mediaItemId, TimeSpan position, DateTimeOffset updatedAtUtc)
        {
            SaveProgressCalls++;
            LastMediaId = mediaItemId;
            LastPosition = position;
            LastUpdatedAtUtc = updatedAtUtc;
            return Task.CompletedTask;
        }

        public Task<TimeSpan?> GetLastPositionAsync(string mediaItemId) => Task.FromResult<TimeSpan?>(null);

        public Task<System.Collections.Generic.IReadOnlyList<MediaItem>> GetRecentAsync(int limit) =>
            Task.FromResult<System.Collections.Generic.IReadOnlyList<MediaItem>>(Array.Empty<MediaItem>());
    }
}


