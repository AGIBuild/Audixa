using System;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Services.Impl;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.Stores.Impl;
using AgiBuild.Audixa.ViewModels;
using AgiBuild.Audixa.Presentation.Video;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Sources;
using AgiBuild.Audixa.Sources.Impl;
using AgiBuild.Audixa.Persistence;
using AgiBuild.Audixa.Persistence.Sqlite;
using AgiBuild.Audixa.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AgiBuild.Audixa.AppHost;

public static class AudixaHost
{
    public static IServiceProvider BuildServiceProvider()
    {
        var services = new ServiceCollection();

        services.AddSingleton<TimeProvider>(TimeProvider.System);
        services.AddSingleton<IUiDispatcher, AvaloniaUiDispatcher>();

        // Logging (no PII). For now, no providers are configured; it can be extended later.
        services.AddLogging(b => b.SetMinimumLevel(LogLevel.Information));

        // Core services (stubs for now)
        services.AddSingleton<INotificationService, NotificationService>();
        services.AddSingleton<IMediaPlayerAdapter, NullMediaPlayerAdapter>();
        services.AddSingleton<IPlaybackService, PlaybackService>();
        services.AddSingleton<ISubtitleService, SubtitleService>();

        // Stores
        services.AddSingleton<ILibraryStore, AgiBuild.Audixa.Stores.Sqlite.SqliteLibraryStore>();
        services.AddSingleton<ILearningStore, AgiBuild.Audixa.Stores.Sqlite.SqliteLearningStore>();
        services.AddSingleton<ISmbProfileStore, AgiBuild.Audixa.Stores.Sqlite.SqliteSmbProfileStore>();

        // Persistence (SQLite)
        services.AddSingleton<IAudixaDatabase, AudixaSqliteDatabase>();
        services.AddSingleton<IDatabaseInitializer, SqliteDatabaseInitializer>();
        services.AddSingleton<ISecretProtector>(_ => new ThrowingSecretProtector());
        services.AddSingleton<ISecureSecretStore, AgiBuild.Audixa.Stores.Sqlite.SqliteSecureSecretStore>();

        // Platform helpers (shared implementation; can be overridden by platform modules later)
        services.AddSingleton<IWindowContext, WindowContext>();
        services.AddSingleton<ILocalMediaPicker, AvaloniaLocalMediaPicker>();
        services.AddSingleton<ILocalSubtitlePicker, AvaloniaLocalSubtitlePicker>();

        // Sources (MVP: Local only; SMB later)
        services.AddSingleton<ISourceProvider, LocalFileSourceProvider>();
        services.AddSingleton<ISmbBrowser, NullSmbBrowser>();
        services.AddSingleton<ISmbPlaybackLocator, NullSmbPlaybackLocator>();

        // Presentation adapters
        services.AddSingleton<IVideoSurfaceFactory, MediaPlayerVideoSurfaceFactory>();

        // ViewModels
        services.AddSingleton<ShellViewModel>();
        services.AddSingleton<LibraryViewModel>();
        services.AddSingleton<PlayerViewModel>();
        services.AddSingleton<LearningViewModel>();
        services.AddSingleton<NotificationHostViewModel>();
        services.AddSingleton<MiniPlayerViewModel>();

        // Platform-specific registrations (Desktop/Android/iOS) via runtime discovery.
        RegisterPlatformModule(services);

        return services.BuildServiceProvider();
    }

    private static void RegisterPlatformModule(IServiceCollection services)
    {
        var module = PlatformModuleDiscovery.TryCreate();
        module?.Register(services);
    }
}


