using AgiBuild.Audixa.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AgiBuild.Audixa.ViewModels;

public partial class MiniPlayerViewModel : ViewModelBase
{
    private readonly IPlaybackService _playback;

    public MiniPlayerViewModel(IPlaybackService playback)
    {
        _playback = playback;
    }

    public PlaybackState State => _playback.State;

    [RelayCommand]
    private void TogglePlayPause()
    {
        if (State.IsPlaying)
        {
            _playback.Pause();
        }
        else
        {
            _playback.Play();
        }
    }
}


