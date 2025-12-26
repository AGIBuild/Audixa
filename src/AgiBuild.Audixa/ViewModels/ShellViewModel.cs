using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using AgiBuild.Audixa.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AgiBuild.Audixa.ViewModels;

public partial class ShellViewModel : ViewModelBase
{
    public ShellViewModel(
        LibraryViewModel library,
        PlayerViewModel player,
        LearningViewModel learning,
        NotificationHostViewModel notifications,
        MiniPlayerViewModel miniPlayer,
        IPlaybackService playbackService)
    {
        Pages = new ReadOnlyCollection<NavigationItem>(new[]
        {
            new NavigationItem("Library", library, NavigateToCommand),
            new NavigationItem("Player", player, NavigateToCommand),
            new NavigationItem("Learning", learning, NavigateToCommand),
        });

        Notifications = notifications;
        MiniPlayer = miniPlayer;

        CurrentPage = Pages[0].ViewModel;

        playbackService.MediaOpened += (_, _) => CurrentPage = player;
    }

    public IReadOnlyList<NavigationItem> Pages { get; }

    public NotificationHostViewModel Notifications { get; }

    public MiniPlayerViewModel MiniPlayer { get; }

    [ObservableProperty]
    private ViewModelBase _currentPage;

    [RelayCommand]
    private void NavigateTo(ViewModelBase page)
    {
        CurrentPage = page;
    }

    public sealed record NavigationItem(string Title, ViewModelBase ViewModel, IRelayCommand<ViewModelBase> NavigateCommand);
}


