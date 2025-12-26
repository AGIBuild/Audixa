using System;
using Avalonia.Controls;

namespace AgiBuild.Audixa.Services;

public interface IMediaPlayerAdapter
{
    Control View { get; }

    event EventHandler<TimeSpan>? PositionChanged;
    event EventHandler<TimeSpan?>? DurationChanged;
    event EventHandler<string>? ErrorRaised;

    void Open(PlaybackInput input);
    void Play();
    void Pause();
    void Seek(TimeSpan position);
    void SetSpeed(double speed);
}


