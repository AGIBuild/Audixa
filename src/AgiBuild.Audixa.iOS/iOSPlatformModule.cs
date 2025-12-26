using AgiBuild.Audixa.AppHost;
using AgiBuild.Audixa.iOS.Platform;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Services;
using Microsoft.Extensions.DependencyInjection;

namespace AgiBuild.Audixa.iOS;

public sealed class IosPlatformModule : IAudixaPlatformModule
{
    public void Register(IServiceCollection services)
    {
        services.AddSingleton<IMediaPlayerAdapter, IosMediaPlayerAdapter>();
        services.AddSingleton<ILocalMediaPicker, IosLocalMediaPicker>();
        services.AddSingleton<ILocalSubtitlePicker, IosLocalSubtitlePicker>();
    }
}


