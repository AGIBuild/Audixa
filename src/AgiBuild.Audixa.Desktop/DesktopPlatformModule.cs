using System;
using AgiBuild.Audixa.AppHost;
using AgiBuild.Audixa.Desktop.Video;
using AgiBuild.Audixa.Desktop.Security;
using AgiBuild.Audixa.Desktop.Sources;
using AgiBuild.Audixa.Persistence;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Sources;
using Microsoft.Extensions.DependencyInjection;

namespace AgiBuild.Audixa.Desktop;

public sealed class DesktopPlatformModule : IAudixaPlatformModule
{
    public void Register(IServiceCollection services)
    {
        // Override default (shared) media player adapter with Desktop implementation.
        services.AddSingleton<IMediaPlayerAdapter, WebView2MediaPlayerAdapter>();

        // Secure secrets (remembered SMB passwords)
        if (OperatingSystem.IsWindows())
            services.AddSingleton<ISecretProtector, WindowsDpapiSecretProtector>();

        // SMB browsing via UNC/local filesystem
        services.AddSingleton<ISmbBrowser, DesktopSmbBrowser>();
        services.AddSingleton<ISmbPlaybackLocator, DesktopSmbPlaybackLocator>();
    }
}


