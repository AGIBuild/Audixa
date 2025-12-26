using AgiBuild.Audixa.Services;
using Avalonia.Controls;

namespace AgiBuild.Audixa.Presentation.Video;

public sealed class MediaPlayerVideoSurfaceFactory : IVideoSurfaceFactory
{
    private readonly IMediaPlayerAdapter _adapter;

    public MediaPlayerVideoSurfaceFactory(IMediaPlayerAdapter adapter)
    {
        _adapter = adapter;
    }

    public Control Create()
    {
        return _adapter.View;
    }
}


