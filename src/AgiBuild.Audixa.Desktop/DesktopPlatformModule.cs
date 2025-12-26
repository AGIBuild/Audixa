using AgiBuild.Audixa.AppHost;
using AgiBuild.Audixa.Desktop.Video;
using AgiBuild.Audixa.Services;
using Microsoft.Extensions.DependencyInjection;

namespace AgiBuild.Audixa.Desktop;

public sealed class DesktopPlatformModule : IAudixaPlatformModule
{
    public void Register(IServiceCollection services)
    {
        // Override default (shared) media player adapter with Desktop implementation.
        services.AddSingleton<IMediaPlayerAdapter, WebView2MediaPlayerAdapter>();
    }
}


