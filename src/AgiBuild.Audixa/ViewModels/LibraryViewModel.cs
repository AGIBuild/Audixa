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
    private readonly ISmbBrowser _smbBrowser;
    private readonly ISmbPlaybackLocator _smbPlayback;
    private readonly ISecureSecretStore _secrets;
    private readonly ILogger<LibraryViewModel> _logger;
    private readonly TimeProvider _timeProvider;

    private string _smbHost = string.Empty;
    private string _smbShare = string.Empty;
    private string _smbRelativePath = string.Empty;

    public LibraryViewModel(
        ILibraryStore libraryStore,
        INotificationService notifications,
        ISourceProvider localSource,
        IPlaybackService playback,
        ISmbProfileStore smbProfiles,
        ISmbBrowser smbBrowser,
        ISmbPlaybackLocator smbPlayback,
        ISecureSecretStore secrets,
        ILogger<LibraryViewModel> logger,
        TimeProvider timeProvider)
    {
        _libraryStore = libraryStore;
        _notifications = notifications;
        _localSource = localSource;
        _playback = playback;
        _smbProfiles = smbProfiles;
        _smbBrowser = smbBrowser;
        _smbPlayback = smbPlayback;
        _secrets = secrets;
        _logger = logger;
        _timeProvider = timeProvider;

        Initialization = InitializeAsync();

        _playback.MediaOpened += (_, _) => _ = RefreshRecentsAsync();
    }

    public Task Initialization { get; }

    private async Task InitializeAsync()
    {
        await RefreshSmbProfilesAsync();
        await RefreshRecentsAsync();
    }

    [ObservableProperty]
    private string _title = "Library";

    [ObservableProperty]
    private string _newSmbRootPath = @"\\server\share";

    [ObservableProperty]
    private string _newSmbUsername = string.Empty;

    [ObservableProperty]
    private string _newSmbDomain = string.Empty;

    [ObservableProperty]
    private string _newSmbPassword = string.Empty;

    [ObservableProperty]
    private bool _rememberSmbPassword = true;

    public ObservableCollection<SmbProfile> SmbProfileList { get; } = new();

    [ObservableProperty]
    private SmbProfile? _selectedSmbProfile;

    [ObservableProperty]
    private string _currentSmbPath = string.Empty;

    public ObservableCollection<SmbEntryViewModel> SmbEntries { get; } = new();

    public ObservableCollection<MediaItem> RecentItems { get; } = new();

    [RelayCommand]
    private async Task OpenLocalMp4Async()
    {
        var req = await _localSource.PickSingleAsync();
        if (req is null)
            return;

        _playback.Open(req.Item, req.Input);
        _notifications.ShowToast("Opened", req.Item.DisplayName);
        await RefreshRecentsAsync();
    }

    [RelayCommand]
    private async Task RefreshRecentsAsync()
    {
        var list = await _libraryStore.GetRecentAsync(20);
        RecentItems.Clear();
        foreach (var item in list)
            RecentItems.Add(item);
    }

    [RelayCommand]
    private void OpenRecent(MediaItem item)
    {
        try
        {
            var uri = TryCreateUri(item);
            if (uri is null)
            {
                _notifications.ShowToast("Not supported", "Cannot open this item yet.");
                return;
            }

            _playback.Open(item, new DirectUriPlaybackInput(uri));
            _notifications.ShowToast("Opened", item.DisplayName);
        }
        catch (Exception ex)
        {
            _notifications.ShowTopAlert("Open failed: " + ex.Message);
        }
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

        if (!SmbPath.TryParseRoot(root, out var host, out var share))
        {
            _notifications.ShowTopAlert("Invalid SMB path. Use \\\\host\\share or smb://host/share");
            return;
        }

        var username = string.IsNullOrWhiteSpace(NewSmbUsername) ? null : NewSmbUsername.Trim();
        var domain = string.IsNullOrWhiteSpace(NewSmbDomain) ? null : NewSmbDomain.Trim();

        string? secretId = null;
        if (RememberSmbPassword && !string.IsNullOrWhiteSpace(NewSmbPassword))
        {
            try
            {
                var purpose = $"smb-password:{host}/{share}:{username ?? "(anonymous)"}";
                secretId = await _secrets.UpsertAsync(purpose, NewSmbPassword.Trim());
            }
            catch (Exception ex)
            {
                _notifications.ShowTopAlert("Remember password failed: " + ex.Message);
                return;
            }
        }

        var profile = new SmbProfile(
            Id: Guid.NewGuid().ToString("N"),
            Name: $"{host}/{share}",
            RootPath: $"smb://{host}/{share}",
            UpdatedAtUtc: _timeProvider.GetUtcNow(),
            Deleted: false,
            Host: host,
            Share: share,
            Username: username,
            Domain: domain,
            SecretId: secretId);

        await _smbProfiles.UpsertAsync(profile);
        _notifications.ShowToast("Saved", "SMB profile saved.");
        await RefreshSmbProfilesAsync();

        // Don't keep password in memory longer than needed.
        NewSmbPassword = string.Empty;
    }

    [RelayCommand]
    private async Task BrowseSmbAsync()
    {
        var profile = SelectedSmbProfile;
        if (profile is null)
            return;

        if (!TryResolveProfileRoot(profile, out _smbHost, out _smbShare))
        {
            _notifications.ShowTopAlert("Invalid SMB profile root.");
            return;
        }

        _smbRelativePath = string.Empty;
        CurrentSmbPath = $"smb://{_smbHost}/{_smbShare}";
        await LoadSmbEntriesAsync(profile);
    }

    private async Task LoadSmbEntriesAsync(SmbProfile profile)
    {
        SmbEntries.Clear();

        try
        {
            var list = await _smbBrowser.ListAsync(new SmbBrowseRequest(
                Host: _smbHost,
                Share: _smbShare,
                Path: _smbRelativePath,
                Username: profile.Username,
                Domain: profile.Domain,
                SecretId: profile.SecretId));

            foreach (var e in list)
            {
                SmbEntries.Add(new SmbEntryViewModel(
                    Name: e.Name,
                    FullPath: BuildRelativePath(_smbRelativePath, e.Name, e.IsDirectory),
                    IsDirectory: e.IsDirectory,
                    OpenCommand: OpenSmbEntryCommand));
            }
        }
        catch (Exception ex)
        {
            _notifications.ShowTopAlert("SMB browse failed: " + ex.Message);
            _logger.LogWarning(ex, "SMB browse failed for {Host}/{Share} {Path}", _smbHost, _smbShare, _smbRelativePath);
        }
    }

    [RelayCommand]
    private async Task OpenSmbEntryAsync(SmbEntryViewModel entry)
    {
        var profile = SelectedSmbProfile;
        if (profile is null)
            return;
        if (!TryResolveProfileRoot(profile, out _smbHost, out _smbShare))
            return;

        if (entry.IsDirectory)
        {
            CurrentSmbPath = entry.FullPath;
            _smbRelativePath = ToRelativePath(entry.FullPath);
            CurrentSmbPath = $"smb://{_smbHost}/{_smbShare}/{_smbRelativePath.Replace("\\", "/")}";
            await LoadSmbEntriesAsync(profile);
            return;
        }

        if (!entry.Name.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase))
        {
            _notifications.ShowToast("Not supported", "MVP supports MP4 only.");
            return;
        }

        var rel = ToRelativePath(entry.FullPath);
        var uri = _smbPlayback.CreatePlaybackUri(_smbHost, _smbShare, rel, profile);

        var item = new MediaItem(
            Id: MediaItemId.From(MediaSourceKind.Smb, SmbPath.BuildStableLocator(_smbHost, _smbShare, rel)),
            DisplayName: entry.Name,
            SourceKind: MediaSourceKind.Smb,
            SourceLocator: uri.ToString(),
            Duration: null);

        _playback.Open(item, new DirectUriPlaybackInput(uri));
        _notifications.ShowToast("Opened", item.DisplayName);
        await RefreshRecentsAsync();
    }

    public sealed record SmbEntryViewModel(string Name, string FullPath, bool IsDirectory, IAsyncRelayCommand<SmbEntryViewModel> OpenCommand);

    private static bool TryResolveProfileRoot(SmbProfile profile, out string host, out string share)
    {
        host = profile.Host ?? string.Empty;
        share = profile.Share ?? string.Empty;
        if (!string.IsNullOrWhiteSpace(host) && !string.IsNullOrWhiteSpace(share))
            return true;

        return SmbPath.TryParseRoot(profile.RootPath, out host, out share);
    }

    private static string BuildRelativePath(string currentRel, string name, bool isDir)
    {
        // Keep the existing FullPath property name for minimal UI change; it now holds "relative path within share".
        var rel = SmbPath.NormalizeRelativePath(currentRel);
        var combined = string.IsNullOrEmpty(rel) ? name : $"{rel}\\{name}";
        return isDir ? combined.TrimEnd('\\') : combined;
    }

    private static string ToRelativePath(string fullPath) => SmbPath.NormalizeRelativePath(fullPath);

    private static Uri? TryCreateUri(MediaItem item)
    {
        // Local media
        if (Uri.TryCreate(item.SourceLocator, UriKind.Absolute, out var abs))
            return abs;

        // UNC / file path
        try
        {
            return new Uri("file:" + item.SourceLocator.Replace("\\", "/"));
        }
        catch
        {
            return null;
        }
    }
}


