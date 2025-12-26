using System;
using Foundation;
using UIKit;
using Avalonia;
using Avalonia.Controls;
using Avalonia.iOS;
using Avalonia.Media;
using AgiBuild.Audixa.iOS.Platform;

namespace AgiBuild.Audixa.iOS;

// The UIApplicationDelegate for the application. This class is responsible for launching the 
// User Interface of the application, as well as listening (and optionally responding) to 
// application events from iOS.
[Register("AppDelegate")]
#pragma warning disable CA1711 // Identifiers should not have incorrect suffix
public partial class AppDelegate : AvaloniaAppDelegate<App>
#pragma warning restore CA1711 // Identifiers should not have incorrect suffix
{
    private bool _videoLayerInitialized;

    public AppDelegate()
    {
        if (this is IAvaloniaAppDelegate lifetime)
        {
            lifetime.Activated += (_, _) => TryInitializeVideoLayer();
        }
    }

    private void TryInitializeVideoLayer()
    {
        if (_videoLayerInitialized)
            return;

        try
        {
            // iOS 13+: resolve key window via connected scenes (avoid obsolete UIApplication.KeyWindow/Windows).
            UIWindow? window = null;
            foreach (var scene in UIApplication.SharedApplication.ConnectedScenes)
            {
                if (scene is not UIWindowScene windowScene)
                    continue;

                foreach (var w in windowScene.Windows)
                {
                    if (w.IsKeyWindow)
                    {
                        window = w;
                        break;
                    }
                }

                if (window is null && windowScene.Windows.Length > 0)
                    window = windowScene.Windows[0];

                if (window is not null)
                    break;
            }

            var rootView = window?.RootViewController?.View;
            if (rootView is null)
                return;

            var videoView = new UIView(rootView.Bounds)
            {
                BackgroundColor = UIColor.Black,
                AutoresizingMask = UIViewAutoresizing.FlexibleWidth | UIViewAutoresizing.FlexibleHeight,
            };
            rootView.InsertSubview(videoView, 0);
            IosVideoHost.Initialize(videoView);
            _videoLayerInitialized = true;
        }
        catch
        {
            // Best-effort initialization.
        }
    }

    protected override AppBuilder CustomizeAppBuilder(AppBuilder builder)
    {
        return base.CustomizeAppBuilder(builder)
            .WithInterFont();
    }
}
