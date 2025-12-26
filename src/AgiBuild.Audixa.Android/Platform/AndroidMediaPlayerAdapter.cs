using System;
using System.Threading;
using global::Android.Views;
using AndroidX.Media3.Common;
using AndroidX.Media3.ExoPlayer;
using AgiBuild.Audixa.Services;
using Avalonia.Controls;
using Avalonia.Media;

namespace AgiBuild.Audixa.Android.Platform;

public sealed class AndroidMediaPlayerAdapter : IMediaPlayerAdapter
{
    private IExoPlayer? _player;
    private Surface? _surface;
    private PlaybackInput? _currentInput;
    private Timer? _positionTimer;
    private long _lastPositionMs = -1;

    public Control View { get; } = new Border
    {
        Background = Brushes.Black,
        Child = new TextBlock
        {
            Text = "Android video layer is hosted behind the UI (TextureView).",
            Foreground = Brushes.Gray,
            HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center,
            VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center,
        }
    };

    public event EventHandler<TimeSpan>? PositionChanged;
    public event EventHandler<TimeSpan?>? DurationChanged;
    public event EventHandler<string>? ErrorRaised;

    public AndroidMediaPlayerAdapter()
    {
        // Lazy init on first Open to ensure Activity is ready.
    }

    public void Open(PlaybackInput input)
    {
        _currentInput = input;

        try
        {
            StopTimer();
            EnsureSurface();

            var activity = AndroidVideoHost.Activity;
            if (activity is null)
            {
                ErrorRaised?.Invoke(this, "Android activity not available.");
                return;
            }

            EnsurePlayer(activity);
            if (_player is null)
                return;

            _player.SetVideoSurface(_surface);

            if (input is DirectUriPlaybackInput direct)
            {
                var androidUri = global::Android.Net.Uri.Parse(direct.Uri.ToString());
                if (androidUri is null)
                {
                    ErrorRaised?.Invoke(this, "Invalid URI.");
                    return;
                }

                var mediaItem = MediaItem.FromUri(androidUri);
                _player.SetMediaItem(mediaItem);
            }
            else
            {
                ErrorRaised?.Invoke(this, $"Unsupported playback input: {input.GetType().Name}");
                return;
            }

            _player.Prepare();
        }
        catch (Exception ex)
        {
            ErrorRaised?.Invoke(this, "Open failed: " + ex.Message);
        }
    }

    public void Play()
    {
        try
        {
            EnsureSurface();
            if (_player is null)
                return;

            _player.PlayWhenReady = true;
            StartTimer();
        }
        catch (Exception ex)
        {
            ErrorRaised?.Invoke(this, "Play failed: " + ex.Message);
        }
    }

    public void Pause()
    {
        try
        {
            if (_player is null)
                return;

            _player.PlayWhenReady = false;
            StopTimer();
        }
        catch
        {
            // ignore
        }
    }

    public void Seek(TimeSpan position)
    {
        try
        {
            if (_player is null)
                return;

            _player.SeekTo((long)position.TotalMilliseconds);
        }
        catch (Exception ex)
        {
            ErrorRaised?.Invoke(this, "Seek failed: " + ex.Message);
        }
    }

    public void SetSpeed(double speed)
    {
        try
        {
            if (_player is null)
                return;

            _player.PlaybackParameters = new PlaybackParameters((float)speed);
        }
        catch
        {
            // MVP: ignore if unsupported
        }
    }

    private void EnsurePlayer(global::Android.Content.Context context)
    {
        if (_player is not null)
            return;

        _player = new ExoPlayerBuilder(context).Build();
        if (_player is null)
        {
            ErrorRaised?.Invoke(this, "Failed to create ExoPlayer.");
            return;
        }

        _player.AddListener(new Listener(this));
    }

    private void EnsureSurface()
    {
        if (_surface is not null)
            return;

        if (!AndroidVideoHost.TryGetSurface(out var s) || s is null)
        {
            // TextureView might not be ready yet.
            ErrorRaised?.Invoke(this, "Video surface not ready.");
            return;
        }

        _surface = s;
    }

    private sealed class Listener : Java.Lang.Object, IPlayerListener
    {
        private readonly AndroidMediaPlayerAdapter _owner;

        public Listener(AndroidMediaPlayerAdapter owner)
        {
            _owner = owner;
        }

        public void OnPlaybackStateChanged(int playbackState)
        {
            if (_owner._player is null)
                return;

            // Media3 constants: STATE_READY = 3, STATE_ENDED = 4.
            if (playbackState == 3)
            {
                var durationMs = _owner._player.Duration;
                if (durationMs > 0)
                    _owner.DurationChanged?.Invoke(_owner, TimeSpan.FromMilliseconds(durationMs));
            }
            else if (playbackState == 4)
            {
                _owner.StopTimer();
                var durationMs = _owner._player.Duration;
                if (durationMs > 0)
                    _owner.PositionChanged?.Invoke(_owner, TimeSpan.FromMilliseconds(durationMs));
            }
        }

        public void OnPlayerError(PlaybackException? error)
        {
            _owner.ErrorRaised?.Invoke(_owner, "ExoPlayer error: " + (error?.Message ?? "unknown"));
        }

        // Other listener callbacks are not needed for MVP.
    }

    private void StartTimer()
    {
        if (_positionTimer is not null)
            return;

        _lastPositionMs = -1;
        _positionTimer = new Timer(_ =>
        {
            try
            {
                var p = _player;
                if (p is null)
                    return;
                if (!p.IsPlaying)
                    return;

                var ms = p.CurrentPosition;
                if (ms < 0)
                    return;
                if (ms == Interlocked.Read(ref _lastPositionMs))
                    return;

                Interlocked.Exchange(ref _lastPositionMs, ms);
                PositionChanged?.Invoke(this, TimeSpan.FromMilliseconds(ms));
            }
            catch
            {
                // ignore
            }
        }, null, dueTime: 0, period: 250);
    }

    private void StopTimer()
    {
        try
        {
            _positionTimer?.Dispose();
        }
        catch
        {
            // ignore
        }
        finally
        {
            _positionTimer = null;
        }
    }
}


