using System;
using System.IO;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Services;

namespace AgiBuild.Audixa.Sources.Impl;

public sealed class LocalFileSourceProvider : ISourceProvider
{
    private readonly ILocalMediaPicker _picker;

    public LocalFileSourceProvider(ILocalMediaPicker picker)
    {
        _picker = picker;
    }

    public string Id => "local";

    public string DisplayName => "Local Storage";

    public async Task<MediaOpenRequest?> PickSingleAsync()
    {
        var uri = await _picker.PickVideoAsync();
        if (uri is null)
            return null;

        var item = new MediaItem(
            Id: Guid.NewGuid().ToString("N"),
            DisplayName: Path.GetFileName(uri.LocalPath),
            SourceKind: MediaSourceKind.Local,
            SourceLocator: uri.ToString(),
            Duration: null);

        return new MediaOpenRequest(item, new DirectUriPlaybackInput(uri));
    }
}


