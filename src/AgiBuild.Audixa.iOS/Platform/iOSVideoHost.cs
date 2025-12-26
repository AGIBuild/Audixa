using System;
using UIKit;

namespace AgiBuild.Audixa.iOS.Platform;

public static class IosVideoHost
{
    private static UIView? _videoView;

    public static void Initialize(UIView videoView)
    {
        _videoView = videoView;
    }

    public static UIView? VideoView => _videoView;
}


