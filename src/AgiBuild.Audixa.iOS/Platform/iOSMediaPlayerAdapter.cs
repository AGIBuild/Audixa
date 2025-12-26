using System;
using AgiBuild.Audixa.Services;
using Avalonia.Controls;
using Avalonia.Media;
using AVFoundation;
using CoreFoundation;
using CoreMedia;
using Foundation;
using UIKit;

namespace AgiBuild.Audixa.iOS.Platform;

public sealed class IosMediaPlayerAdapter : IMediaPlayerAdapter
{
    private AVPlayer? _player;
    private AVPlayerItem? _item;
    private AVPlayerLayer? _layer;
    private NSObject? _timeObserver;
    private double _speed = 1.0;

    public Control View { get; } = new Border
    {
        Background = Brushes.Black,
        Child = new TextBlock
        {
            Text = "iOS video layer is hosted behind the UI (UIView + AVPlayerLayer).",
            Foreground = Brushes.Gray,
            HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center,
            VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center,
        }
    };

    public event EventHandler<TimeSpan>? PositionChanged;
    public event EventHandler<TimeSpan?>? DurationChanged;
    public event EventHandler<string>? ErrorRaised;

    public void Open(PlaybackInput input)
    {
        try
        {
            if (input is not DirectUriPlaybackInput direct)
            {
                ErrorRaised?.Invoke(this, $"Unsupported playback input: {input.GetType().Name}");
                return;
            }

            if (!direct.Uri.IsFile)
            {
                // MVP: only local file URL on iOS adapter.
                ErrorRaised?.Invoke(this, "iOS adapter supports file:// only for now.");
                return;
            }

            var host = IosVideoHost.VideoView;
            if (host is null)
            {
                ErrorRaised?.Invoke(this, "iOS video host not initialized.");
                return;
            }

            CleanupPlayer();

            _player = new AVPlayer();
            var nsUrl = NSUrl.FromFilename(direct.Uri.LocalPath);
            _item = new AVPlayerItem(nsUrl);
            _player.ReplaceCurrentItemWithPlayerItem(_item);

            _layer = AVPlayerLayer.FromPlayer(_player);
            _layer.VideoGravity = AVLayerVideoGravity.ResizeAspect;
            _layer.Frame = host.Bounds;
            host.Layer.AddSublayer(_layer);

            // Duration + position callbacks (poll via periodic time observer).
            _timeObserver = _player.AddPeriodicTimeObserver(
                CMTime.FromSeconds(0.25, 600),
                DispatchQueue.MainQueue,
                time =>
                {
                    try
                    {
                        // Keep layer in sync with host bounds.
                        if (_layer is not null && host is not null)
                            _layer.Frame = host.Bounds;

                        var seconds = time.Seconds;
                        if (!double.IsNaN(seconds) && seconds >= 0)
                            PositionChanged?.Invoke(this, TimeSpan.FromSeconds(seconds));

                        if (_item is not null)
                        {
                            var d = _item.Duration;
                            var ds = d.Seconds;
                            if (!double.IsNaN(ds) && ds > 0)
                                DurationChanged?.Invoke(this, TimeSpan.FromSeconds(ds));
                        }
                    }
                    catch
                    {
                        // ignore
                    }
                });
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
            if (_player is null)
                return;

            _player.Play();
            if (_speed != 1.0)
                _player.Rate = (float)_speed;
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
            _player?.Pause();
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

            var t = CMTime.FromSeconds(position.TotalSeconds, 600);
            _player.Seek(t);
        }
        catch (Exception ex)
        {
            ErrorRaised?.Invoke(this, "Seek failed: " + ex.Message);
        }
    }

    public void SetSpeed(double speed)
    {
        if (speed <= 0)
            return;

        _speed = speed;
        try
        {
            if (_player is null)
                return;

            if (_player.Rate != 0)
                _player.Rate = (float)speed;
        }
        catch
        {
            // ignore
        }
    }

    private void CleanupPlayer()
    {
        try
        {
            if (_timeObserver is not null && _player is not null)
                _player.RemoveTimeObserver(_timeObserver);
        }
        catch
        {
            // ignore
        }
        finally
        {
            _timeObserver?.Dispose();
            _timeObserver = null;
        }

        try
        {
            _layer?.RemoveFromSuperLayer();
        }
        catch
        {
            // ignore
        }
        finally
        {
            _layer?.Dispose();
            _layer = null;
        }

        try
        {
            _item?.Dispose();
        }
        catch
        {
            // ignore
        }
        finally
        {
            _item = null;
        }

        try
        {
            _player?.Pause();
            _player?.Dispose();
        }
        catch
        {
            // ignore
        }
        finally
        {
            _player = null;
        }
    }
}


