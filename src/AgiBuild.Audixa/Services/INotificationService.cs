using System;

namespace AgiBuild.Audixa.Services;

public interface INotificationService
{
    event EventHandler<ToastNotification>? ToastRaised;
    event EventHandler<string>? TopAlertRaised;

    void ShowToast(string title, string message);
    void ShowTopAlert(string message);
}

public sealed record ToastNotification(string Title, string Message);


