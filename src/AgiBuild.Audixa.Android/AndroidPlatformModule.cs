using AgiBuild.Audixa.AppHost;
using AgiBuild.Audixa.Android.Platform;
using AgiBuild.Audixa.Android.Platform.Smb;
using AgiBuild.Audixa.Persistence;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Sources;
using AgiBuild.Audixa.Sources.Impl;
using Microsoft.Extensions.DependencyInjection;

namespace AgiBuild.Audixa.Android;

public sealed class AndroidPlatformModule : IAudixaPlatformModule
{
    public void Register(IServiceCollection services)
    {
        services.AddSingleton<IMediaPlayerAdapter, AndroidMediaPlayerAdapter>();
        services.AddSingleton<ILocalMediaPicker, AndroidLocalMediaPicker>();
        services.AddSingleton<ILocalSubtitlePicker, AndroidLocalSubtitlePicker>();

        // Secure secrets (remembered SMB passwords)
        services.AddSingleton<ISecretProtector, AndroidKeystoreSecretProtector>();

        // SMB browser (Android SMBJ bridge)
        services.AddSingleton<AndroidSmbBrowser>();
        services.AddSingleton<ISmbBrowser>(sp => new CachedSmbBrowser(
            sp.GetRequiredService<AndroidSmbBrowser>(),
            sp.GetRequiredService<SmbBrowseCache>()));
        services.AddSingleton<ISmbPlaybackLocator, AndroidSmbPlaybackLocator>();
    }
}


