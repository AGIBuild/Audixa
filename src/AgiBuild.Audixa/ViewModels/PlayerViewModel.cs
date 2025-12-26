using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Presentation.Video;
using AgiBuild.Audixa.Stores;
using Avalonia.Controls;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AgiBuild.Audixa.ViewModels;

public partial class PlayerViewModel : ViewModelBase
{
    private readonly IPlaybackService _playback;
    private readonly IVideoSurfaceFactory _videoSurfaceFactory;
    private readonly ISubtitleService _subtitles;
    private readonly ILocalSubtitlePicker _subtitlePicker;
    private readonly ILearningStore _learningStore;
    private readonly INotificationService _notifications;
    private readonly TimeProvider _timeProvider;

    private IReadOnlyList<SubtitleCue> _primary = Array.Empty<SubtitleCue>();
    private IReadOnlyList<SubtitleCue> _secondary = Array.Empty<SubtitleCue>();

    public PlayerViewModel(
        IPlaybackService playback,
        IVideoSurfaceFactory videoSurfaceFactory,
        ISubtitleService subtitles,
        ILocalSubtitlePicker subtitlePicker,
        ILearningStore learningStore,
        INotificationService notifications,
        TimeProvider timeProvider)
    {
        _playback = playback;
        _videoSurfaceFactory = videoSurfaceFactory;
        _subtitles = subtitles;
        _subtitlePicker = subtitlePicker;
        _learningStore = learningStore;
        _notifications = notifications;
        _timeProvider = timeProvider;

        VideoSurface = _videoSurfaceFactory.Create();

        _playback.State.PropertyChanged += OnPlaybackStateChanged;
    }

    public PlaybackState State => _playback.State;

    public Control VideoSurface { get; }

    public ObservableCollection<SubtitleRowViewModel> SubtitleRows { get; } = new();

    [ObservableProperty]
    private int _activeIndex = -1;

    [ObservableProperty]
    private int _primaryOffsetMs;

    [ObservableProperty]
    private int _secondaryOffsetMs;

    public string DisplayedPrimaryText =>
        ActiveIndex >= 0 && ActiveIndex < SubtitleRows.Count
            ? MaskText(SubtitleRows[ActiveIndex].PrimaryText, State.MaskMode is MaskMode.HidePrimary or MaskMode.Blind)
            : string.Empty;

    public string DisplayedSecondaryText =>
        ActiveIndex >= 0 && ActiveIndex < SubtitleRows.Count
            ? MaskText(SubtitleRows[ActiveIndex].SecondaryText, State.MaskMode is MaskMode.HideSecondary or MaskMode.Blind)
            : string.Empty;

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

    [RelayCommand]
    private async Task LoadPrimarySubtitleAsync()
    {
        var uri = await _subtitlePicker.PickSubtitleAsync();
        if (uri is null || !uri.IsFile)
            return;

        await using var stream = File.OpenRead(uri.LocalPath);
        _primary = await _subtitles.ParseAsync(stream, GuessFormat(uri.LocalPath));
        RebuildRows();
        UpdateActiveIndex();
    }

    [RelayCommand]
    private async Task LoadSecondarySubtitleAsync()
    {
        var uri = await _subtitlePicker.PickSubtitleAsync();
        if (uri is null || !uri.IsFile)
            return;

        await using var stream = File.OpenRead(uri.LocalPath);
        _secondary = await _subtitles.ParseAsync(stream, GuessFormat(uri.LocalPath));
        RebuildRows();
        UpdateActiveIndex();
    }

    [RelayCommand]
    private void SeekToRow(SubtitleRowViewModel row)
    {
        var t = row.Start + TimeSpan.FromMilliseconds(PrimaryOffsetMs);
        _playback.Seek(t);
        _playback.Play();
    }

    [RelayCommand]
    private void ToggleMask()
    {
        State.MaskMode = State.MaskMode switch
        {
            MaskMode.None => MaskMode.HideSecondary,
            MaskMode.HideSecondary => MaskMode.HidePrimary,
            MaskMode.HidePrimary => MaskMode.Blind,
            MaskMode.Blind => MaskMode.None,
            _ => MaskMode.None,
        };

        OnPropertyChanged(nameof(DisplayedPrimaryText));
        OnPropertyChanged(nameof(DisplayedSecondaryText));
    }

    [RelayCommand]
    private async Task SaveCurrentSentenceAsync()
    {
        if (State.CurrentItem is null)
            return;
        if (ActiveIndex < 0 || ActiveIndex >= SubtitleRows.Count)
            return;

        var row = SubtitleRows[ActiveIndex];
        var offset = TimeSpan.FromMilliseconds(PrimaryOffsetMs);

        var sentence = new SavedSentence(
            Id: Guid.NewGuid().ToString("N"),
            MediaItemId: State.CurrentItem.Id,
            Start: row.Start + offset,
            End: row.End + offset,
            PrimaryText: row.PrimaryText,
            SecondaryText: row.SecondaryText,
            UpdatedAtUtc: _timeProvider.GetUtcNow(),
            Deleted: false);

        await _learningStore.AddSavedSentenceAsync(sentence);
        _notifications.ShowToast("Saved", "Sentence saved.");
    }

    private void OnPlaybackStateChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(PlaybackState.Position))
        {
            UpdateActiveIndex();
        }
        else if (e.PropertyName == nameof(PlaybackState.MaskMode))
        {
            OnPropertyChanged(nameof(DisplayedPrimaryText));
            OnPropertyChanged(nameof(DisplayedSecondaryText));
        }
    }

    private void UpdateActiveIndex()
    {
        if (SubtitleRows.Count == 0)
        {
            ActiveIndex = -1;
            return;
        }

        var t = State.Position;
        for (var i = 0; i < SubtitleRows.Count; i++)
        {
            var row = SubtitleRows[i];
            var start = row.Start + TimeSpan.FromMilliseconds(PrimaryOffsetMs);
            var end = row.End + TimeSpan.FromMilliseconds(PrimaryOffsetMs);
            if (t >= start && t < end)
            {
                if (ActiveIndex != i)
                {
                    ActiveIndex = i;
                    OnPropertyChanged(nameof(DisplayedPrimaryText));
                    OnPropertyChanged(nameof(DisplayedSecondaryText));
                }
                return;
            }
        }
    }

    [RelayCommand]
    private void AdjustPrimaryOffset(int deltaMs)
    {
        PrimaryOffsetMs += deltaMs;
        UpdateActiveIndex();
    }

    [RelayCommand]
    private void AdjustSecondaryOffset(int deltaMs)
    {
        SecondaryOffsetMs += deltaMs;
        // Secondary offset affects display alignment only; for MVP we keep matching unchanged.
        OnPropertyChanged(nameof(DisplayedSecondaryText));
    }

    private void RebuildRows()
    {
        SubtitleRows.Clear();

        if (_primary.Count == 0)
            return;

        // Simple alignment: try match by index, else by same start time within 500ms.
        for (var i = 0; i < _primary.Count; i++)
        {
            var p = _primary[i];
            string? sText = null;

            if (i < _secondary.Count)
            {
                sText = _secondary[i].Text;
            }
            else if (_secondary.Count > 0)
            {
                var match = _secondary.FirstOrDefault(s => Math.Abs((s.Start - p.Start).TotalMilliseconds) <= 500);
                sText = match?.Text;
            }

            SubtitleRows.Add(new SubtitleRowViewModel(p.Start, p.End, p.Text, sText, SeekToRowCommand));
        }
    }

    private static SubtitleFormat GuessFormat(string path)
    {
        return Path.GetExtension(path).Equals(".vtt", StringComparison.OrdinalIgnoreCase)
            ? SubtitleFormat.Vtt
            : SubtitleFormat.Srt;
    }

    private static string MaskText(string? text, bool masked)
    {
        if (string.IsNullOrEmpty(text))
            return string.Empty;
        return masked ? "••••••" : text;
    }

    public sealed record SubtitleRowViewModel(
        TimeSpan Start,
        TimeSpan End,
        string PrimaryText,
        string? SecondaryText,
        IRelayCommand<SubtitleRowViewModel> SeekCommand);
}


