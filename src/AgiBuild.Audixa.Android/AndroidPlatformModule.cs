using AgiBuild.Audixa.AppHost;
using AgiBuild.Audixa.Android.Platform;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Services;
using Microsoft.Extensions.DependencyInjection;

namespace AgiBuild.Audixa.Android;

public sealed class AndroidPlatformModule : IAudixaPlatformModule
{
    public void Register(IServiceCollection services)
    {
        services.AddSingleton<IMediaPlayerAdapter, AndroidMediaPlayerAdapter>();
        services.AddSingleton<ILocalMediaPicker, AndroidLocalMediaPicker>();
        services.AddSingleton<ILocalSubtitlePicker, AndroidLocalSubtitlePicker>();
    }
}


