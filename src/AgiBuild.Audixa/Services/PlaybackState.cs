using System;
using AgiBuild.Audixa.Domain;
using CommunityToolkit.Mvvm.ComponentModel;

namespace AgiBuild.Audixa.Services;

public partial class PlaybackState : ObservableObject
{
    [ObservableProperty]
    private MediaItem? _currentItem;

    [ObservableProperty]
    private TimeSpan _position;

    [ObservableProperty]
    private TimeSpan? _duration;

    [ObservableProperty]
    private bool _isPlaying;

    [ObservableProperty]
    private double _speed = 1.0;

    [ObservableProperty]
    private MaskMode _maskMode = MaskMode.None;

    [ObservableProperty]
    private string? _errorMessage;
}

public enum MaskMode
{
    None = 0,
    HidePrimary = 1,
    HideSecondary = 2,
    Blind = 3,
}


