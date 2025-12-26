using System;
using Avalonia.Controls;
using Avalonia.Media;

namespace AgiBuild.Audixa.Services.Impl;

public sealed class NullMediaPlayerAdapter : IMediaPlayerAdapter
{
#pragma warning disable CS0067 // Event is never used
    public Control View { get; } = new Border
    {
        Background = Brushes.Black,
        Child = new TextBlock
        {
            Text = "Video playback not available on this platform yet.",
            Foreground = Brushes.Gray,
            HorizontalAlignment = Avalonia.Layout.HorizontalAlignment.Center,
            VerticalAlignment = Avalonia.Layout.VerticalAlignment.Center,
        },
    };

    public event EventHandler<TimeSpan>? PositionChanged;
    public event EventHandler<TimeSpan?>? DurationChanged;
    public event EventHandler<string>? ErrorRaised;
#pragma warning restore CS0067 // Event is never used

    public void Open(PlaybackInput input)
    {
        ErrorRaised?.Invoke(this, "No media player adapter available.");
    }

    public void Play() { }
    public void Pause() { }
    public void Seek(TimeSpan position) { }
    public void SetSpeed(double speed) { }
}


