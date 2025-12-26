using System;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Services;

public interface IPlaybackService
{
    PlaybackState State { get; }

    event EventHandler<MediaItem>? MediaOpened;

    void Play();
    void Pause();
    void Seek(TimeSpan position);
    void SetSpeed(double speed);

    void Open(MediaItem item, PlaybackInput input);
}


