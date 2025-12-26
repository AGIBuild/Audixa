using System.Collections.ObjectModel;
using AgiBuild.Audixa.Services;
using CommunityToolkit.Mvvm.ComponentModel;

namespace AgiBuild.Audixa.ViewModels;

public partial class NotificationHostViewModel : ViewModelBase
{
    private readonly INotificationService _notifications;

    public NotificationHostViewModel(INotificationService notifications)
    {
        _notifications = notifications;
        _notifications.ToastRaised += (_, toast) => Toasts.Add(new ToastViewModel(toast.Title, toast.Message));
        _notifications.TopAlertRaised += (_, message) => TopAlertMessage = message;
    }

    public ObservableCollection<ToastViewModel> Toasts { get; } = new();

    [ObservableProperty]
    private string? _topAlertMessage;
}

public sealed record ToastViewModel(string Title, string Message);


