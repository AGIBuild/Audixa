using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Services.Impl;
using AgiBuild.Audixa.ViewModels;
using Xunit;

namespace AgiBuild.Audixa.Tests.ViewModelTests;

public sealed class NotificationHostViewModelTests
{
    [Fact]
    public void ToastRaised_AddsToastViewModel()
    {
        var svc = new NotificationService();
        var vm = new NotificationHostViewModel(svc);

        svc.ShowToast("t1", "m1");

        Assert.Single(vm.Toasts);
        Assert.Equal("t1", vm.Toasts[0].Title);
        Assert.Equal("m1", vm.Toasts[0].Message);
    }

    [Fact]
    public void TopAlertRaised_SetsMessage()
    {
        var svc = new NotificationService();
        var vm = new NotificationHostViewModel(svc);

        svc.ShowTopAlert("boom");

        Assert.Equal("boom", vm.TopAlertMessage);
    }
}


