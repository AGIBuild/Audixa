using System;

namespace AgiBuild.Audixa.Services.Impl;

public sealed class NotificationService : INotificationService
{
    public event EventHandler<ToastNotification>? ToastRaised;
    public event EventHandler<string>? TopAlertRaised;

    public void ShowToast(string title, string message)
    {
        ToastRaised?.Invoke(this, new ToastNotification(title, message));
    }

    public void ShowTopAlert(string message)
    {
        TopAlertRaised?.Invoke(this, message);
    }
}


