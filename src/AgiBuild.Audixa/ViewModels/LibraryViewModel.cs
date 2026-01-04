using System;
using System.Threading.Tasks;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using System.Threading;
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
    private string? _smbContinuationToken;
    private const int DefaultSmbPageSize = 200;

    private CancellationTokenSource? _smbBrowseCts;
    private int _smbBrowseVersion;

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

    partial void OnSelectedSmbProfileChanged(SmbProfile? value)
    {
        if (value is null)
            return;

        NewSmbRootPath = value.RootPath;
        NewSmbUsername = value.Username ?? string.Empty;
        NewSmbDomain = value.Domain ?? string.Empty;
        RememberSmbPassword = value.SecretId is not null;
        NewSmbPassword = string.Empty;
    }

    [ObservableProperty]
    private string _currentSmbPath = string.Empty;

    public ObservableCollection<SmbEntryViewModel> SmbEntries { get; } = new();

    public ObservableCollection<MediaItem> RecentItems { get; } = new();

    [ObservableProperty]
    private bool _isSmbLoading;

    [ObservableProperty]
    private bool _canLoadMoreSmbEntries;

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
            _ = OpenRecentAsync(item);
        }
        catch (Exception ex)
        {
            _notifications.ShowTopAlert("Open failed: " + ex.Message);
        }
    }

    private async Task OpenRecentAsync(MediaItem item)
    {
        try
        {
            if (item.SourceKind == MediaSourceKind.Smb)
            {
                if (!Uri.TryCreate(item.SourceLocator, UriKind.Absolute, out var smbUri) ||
                    !string.Equals(smbUri.Scheme, "smb", StringComparison.OrdinalIgnoreCase))
                {
                    _notifications.ShowToast("Not supported", "Cannot open this SMB item.");
                    return;
                }

                var host = smbUri.Host ?? string.Empty;
                var seg = smbUri.AbsolutePath.Split(new[] { '/' }, StringSplitOptions.RemoveEmptyEntries);
                if (seg.Length < 1)
                {
                    _notifications.ShowToast("Not supported", "Invalid SMB locator.");
                    return;
                }

                var share = seg[0];
                var rel = string.Join("/", seg.Skip(1)).Replace('/', '\\');

                var q = ParseQuery(smbUri.Query);
                q.TryGetValue("profileId", out var profileId);

                if (string.IsNullOrWhiteSpace(profileId))
                {
                    _notifications.ShowToast("Not supported", "Missing SMB profile.");
                    return;
                }

                var profile = await _smbProfiles.TryGetByIdAsync(profileId).ConfigureAwait(true);
                if (profile is null || profile.Deleted)
                {
                    _notifications.ShowToast("Not supported", "SMB profile not found.");
                    return;
                }

                var playbackUri = _smbPlayback.CreatePlaybackUri(host, share, rel, profile);
                _playback.Open(item, new DirectUriPlaybackInput(playbackUri));
                _notifications.ShowToast("Opened", item.DisplayName);
                return;
            }

            // Local media
            if (Uri.TryCreate(item.SourceLocator, UriKind.Absolute, out var abs))
            {
                _playback.Open(item, new DirectUriPlaybackInput(abs));
                _notifications.ShowToast("Opened", item.DisplayName);
                return;
            }

            // UNC / file path
            var fileUri = new Uri("file:" + item.SourceLocator.Replace("\\", "/"));
            _playback.Open(item, new DirectUriPlaybackInput(fileUri));
            _notifications.ShowToast("Opened", item.DisplayName);
        }
        catch
        {
            _notifications.ShowTopAlert("Open failed.");
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

        var password = NewSmbPassword;
        try
        {
            if (!SmbPath.TryParseRoot(root, out var host, out var share))
            {
                _notifications.ShowTopAlert("Invalid SMB path. Use \\\\host\\share or smb://host/share");
                return;
            }

            var username = string.IsNullOrWhiteSpace(NewSmbUsername) ? null : NewSmbUsername.Trim();
            var domain = string.IsNullOrWhiteSpace(NewSmbDomain) ? null : NewSmbDomain.Trim();

            string? secretId = null;
            if (RememberSmbPassword && !string.IsNullOrWhiteSpace(password))
            {
                try
                {
                    var purpose = $"smb-password:{host}/{share}:{username ?? "(anonymous)"}";
                    secretId = await _secrets.UpsertAsync(purpose, password.Trim());
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
        }
        finally
        {
            // Don't keep password in memory longer than needed.
            NewSmbPassword = string.Empty;
        }
    }

    [RelayCommand]
    private async Task UpdateSelectedSmbProfileAsync()
    {
        var existing = SelectedSmbProfile;
        if (existing is null)
            return;

        var root = (NewSmbRootPath ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(root))
            return;

        var password = NewSmbPassword;
        try
        {
            if (!SmbPath.TryParseRoot(root, out var host, out var share))
            {
                _notifications.ShowTopAlert("Invalid SMB path. Use \\\\host\\share or smb://host/share");
                return;
            }

            var username = string.IsNullOrWhiteSpace(NewSmbUsername) ? null : NewSmbUsername.Trim();
            var domain = string.IsNullOrWhiteSpace(NewSmbDomain) ? null : NewSmbDomain.Trim();

            string? secretId = existing.SecretId;

            if (RememberSmbPassword)
            {
                // If user typed a new password, overwrite the existing secret id (if any).
                if (!string.IsNullOrWhiteSpace(password))
                {
                    try
                    {
                        var purpose = $"smb-password:{host}/{share}:{username ?? "(anonymous)"}";
                        secretId = await _secrets.UpsertAsync(purpose, password.Trim(), existing.SecretId);
                    }
                    catch (Exception ex)
                    {
                        _notifications.ShowTopAlert("Remember password failed: " + ex.Message);
                        return;
                    }
                }
            }
            else
            {
                // User chose not to remember password anymore.
                if (!string.IsNullOrWhiteSpace(existing.SecretId))
                {
                    try { await _secrets.DeleteAsync(existing.SecretId); } catch { /* best effort */ }
                }
                secretId = null;
            }

            var updated = new SmbProfile(
                Id: existing.Id,
                Name: $"{host}/{share}",
                RootPath: $"smb://{host}/{share}",
                UpdatedAtUtc: _timeProvider.GetUtcNow(),
                Deleted: false,
                Host: host,
                Share: share,
                Username: username,
                Domain: domain,
                SecretId: secretId);

            await _smbProfiles.UpsertAsync(updated);
            _notifications.ShowToast("Updated", "SMB profile updated.");
            await RefreshSmbProfilesAsync();

            SelectedSmbProfile = updated;
        }
        finally
        {
            NewSmbPassword = string.Empty;
        }
    }

    [RelayCommand]
    private async Task DeleteSelectedSmbProfileAsync()
    {
        var existing = SelectedSmbProfile;
        if (existing is null)
            return;

        try
        {
            if (!string.IsNullOrWhiteSpace(existing.SecretId))
            {
                try { await _secrets.DeleteAsync(existing.SecretId); } catch { /* best effort */ }
            }

            var deleted = existing with
            {
                Deleted = true,
                SecretId = null,
                UpdatedAtUtc = _timeProvider.GetUtcNow(),
            };

            await _smbProfiles.UpsertAsync(deleted);
            _notifications.ShowToast("Deleted", "SMB profile deleted.");

            await RefreshSmbProfilesAsync();

            if (SmbProfileList.Count > 0)
                SelectedSmbProfile = SmbProfileList[0];
            else
                SelectedSmbProfile = null;

            SmbEntries.Clear();
            CurrentSmbPath = string.Empty;
            _smbRelativePath = string.Empty;
        }
        catch (Exception ex)
        {
            _notifications.ShowTopAlert("Delete failed: " + ex.Message);
        }
        finally
        {
            NewSmbPassword = string.Empty;
        }
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
        _smbContinuationToken = null;
        await LoadSmbEntriesAsync(profile, forceRefresh: false);
    }

    [RelayCommand]
    private async Task RefreshSmbListingAsync()
    {
        var profile = SelectedSmbProfile;
        if (profile is null)
            return;
        _smbContinuationToken = null;
        await LoadSmbEntriesAsync(profile, forceRefresh: true);
    }

    [RelayCommand]
    private async Task LoadMoreSmbAsync()
    {
        var profile = SelectedSmbProfile;
        if (profile is null)
            return;
        if (IsSmbLoading)
            return;
        if (string.IsNullOrWhiteSpace(_smbContinuationToken))
            return;

        await LoadSmbEntriesAsync(profile, forceRefresh: false, append: true);
    }

    private async Task LoadSmbEntriesAsync(SmbProfile profile, bool forceRefresh)
        => await LoadSmbEntriesAsync(profile, forceRefresh, append: false);

    private async Task LoadSmbEntriesAsync(SmbProfile profile, bool forceRefresh, bool append)
    {
        var myVersion = Interlocked.Increment(ref _smbBrowseVersion);

        var prev = _smbBrowseCts;
        prev?.Cancel();
        prev?.Dispose();

        var myCts = new CancellationTokenSource();
        _smbBrowseCts = myCts;
        var ct = myCts.Token;

        IsSmbLoading = true;

        try
        {
            var page = await _smbBrowser.ListAsync(new SmbBrowseRequest(
                Host: _smbHost,
                Share: _smbShare,
                Path: _smbRelativePath,
                Username: profile.Username,
                Domain: profile.Domain,
                SecretId: profile.SecretId,
                PageSize: DefaultSmbPageSize,
                ContinuationToken: append ? _smbContinuationToken : null,
                ForceRefresh: forceRefresh), ct);

            if (ct.IsCancellationRequested)
                return;

            if (!append)
            {
                SmbEntries.Clear();

                // Add a synthetic ".." entry for navigation when not at root.
                if (!string.IsNullOrWhiteSpace(_smbRelativePath))
                {
                    var parent = GetParentRelativePath(_smbRelativePath);
                    SmbEntries.Add(new SmbEntryViewModel(
                        Name: "..",
                        FullPath: parent,
                        IsDirectory: true,
                        OpenCommand: OpenSmbEntryCommand));
                }
            }

            foreach (var e in page.Items)
            {
                SmbEntries.Add(new SmbEntryViewModel(
                    Name: e.Name,
                    FullPath: BuildRelativePath(_smbRelativePath, e.Name, e.IsDirectory),
                    IsDirectory: e.IsDirectory,
                    OpenCommand: OpenSmbEntryCommand));
            }

            _smbContinuationToken = page.ContinuationToken;
            CanLoadMoreSmbEntries = !string.IsNullOrWhiteSpace(_smbContinuationToken);
        }
        catch (OperationCanceledException)
        {
            // ignore
        }
        catch (Exception ex)
        {
            _notifications.ShowTopAlert("SMB browse failed: " + ex.Message);
            _logger.LogWarning(ex, "SMB browse failed for {Host}/{Share} {Path}", _smbHost, _smbShare, _smbRelativePath);
        }
        finally
        {
            if (Volatile.Read(ref _smbBrowseVersion) == myVersion)
                IsSmbLoading = false;

            // If we're still the latest request, clean up the CTS.
            if (Volatile.Read(ref _smbBrowseVersion) == myVersion)
            {
                if (ReferenceEquals(_smbBrowseCts, myCts))
                    _smbBrowseCts = null;
                myCts.Dispose();
            }
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
            if (IsSmbLoading)
                return;

            CurrentSmbPath = entry.FullPath;
            _smbRelativePath = ToRelativePath(entry.FullPath);
            CurrentSmbPath = $"smb://{_smbHost}/{_smbShare}/{_smbRelativePath.Replace("\\", "/")}";
            _smbContinuationToken = null;
            await LoadSmbEntriesAsync(profile, forceRefresh: false);
            return;
        }

        if (!entry.Name.EndsWith(".mp4", StringComparison.OrdinalIgnoreCase))
        {
            _notifications.ShowToast("Not supported", "MVP supports MP4 only.");
            return;
        }

        var rel = ToRelativePath(entry.FullPath);
        var uri = _smbPlayback.CreatePlaybackUri(_smbHost, _smbShare, rel, profile);

        // Store a non-sensitive locator for recents: smb://host/share/path?profileId=...
        var storedLocator = BuildSmbStoredLocator(_smbHost, _smbShare, rel, profile.Id);

        var item = new MediaItem(
            Id: MediaItemId.From(MediaSourceKind.Smb, SmbPath.BuildStableLocator(_smbHost, _smbShare, rel)),
            DisplayName: entry.Name,
            SourceKind: MediaSourceKind.Smb,
            SourceLocator: storedLocator,
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

    private static string GetParentRelativePath(string currentRelativePath)
    {
        var cur = SmbPath.NormalizeRelativePath(currentRelativePath);
        if (string.IsNullOrEmpty(cur))
            return string.Empty;

        var idx = cur.LastIndexOf('\\');
        return idx <= 0 ? string.Empty : cur.Substring(0, idx);
    }

    private static string BuildSmbStoredLocator(string host, string share, string relativePath, string profileId)
    {
        var rel = SmbPath.NormalizeRelativePath(relativePath).Replace('\\', '/');
        var path = string.IsNullOrEmpty(rel) ? $"/{share}" : $"/{share}/{rel}";
        var b = new UriBuilder { Scheme = "smb", Host = host, Path = path, Query = "profileId=" + Uri.EscapeDataString(profileId) };
        return b.Uri.ToString();
    }

    private static Dictionary<string, string> ParseQuery(string query)
    {
        var dict = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(query))
            return dict;

        var s = query.StartsWith("?", StringComparison.Ordinal) ? query.Substring(1) : query;
        foreach (var part in s.Split('&', StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = part.Split('=', 2);
            var k = Uri.UnescapeDataString(kv[0]);
            var v = kv.Length == 2 ? Uri.UnescapeDataString(kv[1]) : string.Empty;
            dict[k] = v;
        }
        return dict;
    }

    // NOTE: SMB recents are opened via profile lookup + playback locator, so we do not expose a static TryCreateUri anymore.
}


