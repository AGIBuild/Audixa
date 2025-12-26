using System;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Stores;
using Microsoft.Extensions.Logging;

namespace AgiBuild.Audixa.Services.Impl;

public sealed class PlaybackService : IPlaybackService
{
    private readonly IMediaPlayerAdapter _adapter;
    private readonly INotificationService _notifications;
    private readonly ILibraryStore _libraryStore;
    private readonly ILogger<PlaybackService> _logger;
    private readonly TimeProvider _timeProvider;
    private DateTimeOffset _lastAutoSavedAtUtc = DateTimeOffset.MinValue;
    private TimeSpan _lastAutoSavedPosition = TimeSpan.Zero;

    private static readonly TimeSpan AutoSaveMinInterval = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan AutoSaveMinDelta = TimeSpan.FromSeconds(1);

    public PlaybackState State { get; } = new();

    public event EventHandler<MediaItem>? MediaOpened;

    public PlaybackService(
        IMediaPlayerAdapter adapter,
        INotificationService notifications,
        ILibraryStore libraryStore,
        ILogger<PlaybackService> logger,
        TimeProvider timeProvider)
    {
        _adapter = adapter;
        _notifications = notifications;
        _libraryStore = libraryStore;
        _logger = logger;
        _timeProvider = timeProvider;

        _adapter.PositionChanged += (_, pos) =>
        {
            State.Position = pos;

            if (State.CurrentItem is null)
                return;
            if (!State.IsPlaying)
                return;

            // Throttle progress persistence while playing.
            var now = _timeProvider.GetUtcNow();
            if (now - _lastAutoSavedAtUtc < AutoSaveMinInterval)
                return;
            if (pos - _lastAutoSavedPosition < AutoSaveMinDelta)
                return;

            _lastAutoSavedAtUtc = now;
            _lastAutoSavedPosition = pos;
            _ = _libraryStore.SaveProgressAsync(State.CurrentItem.Id, pos, now);
        };
        _adapter.DurationChanged += (_, dur) => State.Duration = dur;
        _adapter.ErrorRaised += (_, err) =>
        {
            State.ErrorMessage = err;
            _notifications.ShowTopAlert(err);
            _logger.LogWarning("Playback adapter error: {Error}", err);
        };
    }

    public void Play()
    {
        if (State.CurrentItem is null)
        {
            State.ErrorMessage = "No media loaded.";
            return;
        }

        State.ErrorMessage = null;
        // Start autosave window from the moment playback starts.
        _lastAutoSavedAtUtc = _timeProvider.GetUtcNow();
        _lastAutoSavedPosition = State.Position;
        _adapter.Play();
        State.IsPlaying = true;
    }

    public void Pause()
    {
        _adapter.Pause();
        State.IsPlaying = false;

        if (State.CurrentItem is not null)
        {
            _ = _libraryStore.SaveProgressAsync(State.CurrentItem.Id, State.Position, _timeProvider.GetUtcNow());
            _logger.LogInformation("Saved progress: {MediaId} {PositionMs}ms", State.CurrentItem.Id, (long)State.Position.TotalMilliseconds);
        }
    }

    public void Seek(TimeSpan position)
    {
        _adapter.Seek(position);
        State.Position = position;
    }

    public void SetSpeed(double speed)
    {
        if (speed <= 0)
        {
            State.ErrorMessage = "Invalid speed.";
            return;
        }

        _adapter.SetSpeed(speed);
        State.Speed = speed;
    }

    public void Open(MediaItem item, PlaybackInput input)
    {
        State.CurrentItem = item;
        State.Position = TimeSpan.Zero;
        State.Duration = item.Duration;
        State.ErrorMessage = null;
        State.IsPlaying = false;
        State.Speed = 1.0;
        _lastAutoSavedAtUtc = _timeProvider.GetUtcNow();
        _lastAutoSavedPosition = TimeSpan.Zero;

        _adapter.Open(input);
        MediaOpened?.Invoke(this, item);

        _ = _libraryStore.UpsertMediaAsync(item, _timeProvider.GetUtcNow());
        _logger.LogInformation("Opened media: {MediaId} {Name} ({SourceKind})", item.Id, item.DisplayName, item.SourceKind);
    }
}


