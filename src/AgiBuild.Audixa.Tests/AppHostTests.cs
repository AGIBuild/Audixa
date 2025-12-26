using System;
using AgiBuild.Audixa.AppHost;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.ViewModels;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class AppHostTests
{
    [Fact]
    public void BuildServiceProvider_ResolvesRootViewModels()
    {
        var sp = AudixaHost.BuildServiceProvider();

        _ = sp.GetRequiredService<ShellViewModel>();
        _ = sp.GetRequiredService<LibraryViewModel>();
        _ = sp.GetRequiredService<PlayerViewModel>();
        _ = sp.GetRequiredService<LearningViewModel>();
        _ = sp.GetRequiredService<NotificationHostViewModel>();
        _ = sp.GetRequiredService<MiniPlayerViewModel>();
    }

    [Fact]
    public void BuildServiceProvider_ResolvesCoreServices()
    {
        var sp = AudixaHost.BuildServiceProvider();

        _ = sp.GetRequiredService<IPlaybackService>();
        _ = sp.GetRequiredService<ISubtitleService>();
        _ = sp.GetRequiredService<INotificationService>();
        _ = sp.GetRequiredService<ILibraryStore>();
        _ = sp.GetRequiredService<ILearningStore>();
        _ = sp.GetRequiredService<ISmbProfileStore>();
    }
}


