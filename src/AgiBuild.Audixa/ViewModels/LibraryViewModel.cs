using System;
using System.Threading.Tasks;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.Sources;
using AgiBuild.Audixa.Domain;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Microsoft.Extensions.Logging;

namespace AgiBuild.Audixa.ViewModels;

public partial class LibraryViewModel : ViewModelBase
{
    private readonly ILibraryStore _libraryStore;
    private readonly INotificationService _notifications;
    private readonly ISourceProvider _localSource;
    private readonly IPlaybackService _playback;
    private readonly ISmbProfileStore _smbProfiles;
    private readonly ILogger<LibraryViewModel> _logger;
    private readonly TimeProvider _timeProvider;

    public LibraryViewModel(
        ILibraryStore libraryStore,
        INotificationService notifications,
        ISourceProvider localSource,
        IPlaybackService playback,
        ISmbProfileStore smbProfiles,
        ILogger<LibraryViewModel> logger,
        TimeProvider timeProvider)
    {
        _libraryStore = libraryStore;
        _notifications = notifications;
        _localSource = localSource;
        _playback = playback;
        _smbProfiles = smbProfiles;
        _logger = logger;
        _timeProvider = timeProvider;

        Initialization = RefreshSmbProfilesAsync();
    }

    public Task Initialization { get; }

    [ObservableProperty]
    private string _title = "Library";

    [ObservableProperty]
    private string _newSmbRootPath = @"\\server\share";

    public ObservableCollection<SmbProfile> SmbProfileList { get; } = new();

    [ObservableProperty]
    private SmbProfile? _selectedSmbProfile;

    [ObservableProperty]
    private string _currentSmbPath = string.Empty;

    public ObservableCollection<SmbEntryViewModel> SmbEntries { get; } = new();

    [RelayCommand]
    private async Task OpenLocalMp4Async()
    {
        var req = await _localSource.PickSingleAsync();
        if (req is null)
            return;

        _playback.Open(req.Item, req.Input);
        _notifications.ShowToast("Opened", req.Item.DisplayName);
    }

    [RelayCommand]
    private async Task RefreshSmbProfilesAsync()
    {
        var list = await _smbProfiles.GetAllAsync();
        SmbProfileList.Clear();
        foreach (var p in list)
            SmbProfileList.Add(p);

        if (SelectedSmbProfile is null && SmbProfileList.Count > 0)
            SelectedSmbProfile = SmbProfileList[0];
    }

    [RelayCommand]
    private async Task SaveSmbProfileAsync()
    {
        var root = (NewSmbRootPath ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(root))
            return;

        var profile = new SmbProfile(
            Id: Guid.NewGuid().ToString("N"),
            Name: root,
            RootPath: root,
            UpdatedAtUtc: _timeProvider.GetUtcNow(),
            Deleted: false);

        await _smbProfiles.UpsertAsync(profile);
        _notifications.ShowToast("Saved", "SMB profile saved.");
        await RefreshSmbProfilesAsync();
    }

    [RelayCommand]
    private async Task BrowseSmbAsync()
    {
        var root = SelectedSmbProfile?.RootPath ?? (NewSmbRootPath ?? string.Empty);
        if (string.IsNullOrWhiteSpace(root))
            return;

        CurrentSmbPath = root;
        await LoadSmbEntriesAsync(root);
    }

    private async Task LoadSmbEntriesAsync(string path)
    {
        SmbEntries.Clear();

        try
        {
            var entries = await Task.Run(() => Directory.EnumerateFileSystemEntries(path).ToArray());
            foreach (var e in entries)
            {
                var isDir = Directory.Exists(e);
                SmbEntries.Add(new SmbEntryViewModel(
                    Name: Path.GetFileName(e),
                    FullPath: e,
                    IsDirectory: isDir,
                    OpenCommand: OpenSmbEntryCommand));
            }
        }
        catch (Exception ex)
        {
            _notifications.ShowTopAlert("SMB browse failed: " + ex.Message);
            _logger.LogWarning(ex, "SMB browse failed for {Path}", path);
        }
    }

    [RelayCommand]
    private async Task OpenSmbEntryAsync(SmbEntryViewModel entry)
    {
        if (entry.IsDirectory)
        {
            CurrentSmbPath = entry.FullPath;
            await LoadSmbEntriesAsync(entry.FullPath);
            return;
        }

        if (!entry.FullPath.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase))
        {
            _notifications.ShowToast("Not supported", "MVP supports MP4 only.");
            return;
        }

        Uri uri;
        try
        {
            uri = new Uri(entry.FullPath);
        }
        catch
        {
            // Fallback for UNC
            uri = new Uri("file:" + entry.FullPath.Replace("\\", "/"));
        }

        var item = new MediaItem(
            Id: MediaItemId.From(MediaSourceKind.Smb, entry.FullPath),
            DisplayName: Path.GetFileName(entry.FullPath),
            SourceKind: MediaSourceKind.Smb,
            SourceLocator: entry.FullPath,
            Duration: null);

        _playback.Open(item, new DirectUriPlaybackInput(uri));
        _notifications.ShowToast("Opened", item.DisplayName);
    }

    public sealed record SmbEntryViewModel(string Name, string FullPath, bool IsDirectory, IAsyncRelayCommand<SmbEntryViewModel> OpenCommand);
}


