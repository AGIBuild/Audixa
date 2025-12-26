using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Data.Core;
using Avalonia.Data.Core.Plugins;
using System.Linq;
using System;
using Avalonia.Markup.Xaml;
using AgiBuild.Audixa.Views;
using AgiBuild.Audixa.AppHost;
using AgiBuild.Audixa.ViewModels;
using Microsoft.Extensions.DependencyInjection;

namespace AgiBuild.Audixa;

public partial class App : Application
{
    private IServiceProvider? _services;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        _services = AudixaHost.BuildServiceProvider();
        var shellViewModel = _services.GetRequiredService<ShellViewModel>();

        try
        {
            _services.GetRequiredService<AgiBuild.Audixa.Persistence.IDatabaseInitializer>().Initialize();
        }
        catch (Exception ex)
        {
            _services.GetRequiredService<AgiBuild.Audixa.Services.INotificationService>()
                .ShowTopAlert("Database init failed: " + ex.Message);
        }

        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            // Avoid duplicate validations from both Avalonia and the CommunityToolkit. 
            // More info: https://docs.avaloniaui.net/docs/guides/development-guides/data-validation#manage-validationplugins
            DisableAvaloniaDataAnnotationValidation();
            desktop.MainWindow = new MainWindow
            {
                DataContext = shellViewModel
            };

            _services.GetService<AgiBuild.Audixa.Platform.IWindowContext>()!.MainWindow = desktop.MainWindow;
        }
        else if (ApplicationLifetime is ISingleViewApplicationLifetime singleViewPlatform)
        {
            singleViewPlatform.MainView = new ShellView
            {
                DataContext = shellViewModel
            };
        }

        base.OnFrameworkInitializationCompleted();
    }

    private void DisableAvaloniaDataAnnotationValidation()
    {
        // Get an array of plugins to remove
        var dataValidationPluginsToRemove =
            BindingPlugins.DataValidators.OfType<DataAnnotationsValidationPlugin>().ToArray();

        // remove each entry found
        foreach (var plugin in dataValidationPluginsToRemove)
        {
            BindingPlugins.DataValidators.Remove(plugin);
        }
    }
}