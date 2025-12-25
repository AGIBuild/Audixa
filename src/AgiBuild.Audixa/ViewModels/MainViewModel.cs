using CommunityToolkit.Mvvm.ComponentModel;

namespace AgiBuild.Audixa.ViewModels;

public partial class MainViewModel : ViewModelBase
{
    [ObservableProperty]
    private string _greeting = "Welcome to Avalonia!";
}
