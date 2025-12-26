using System;
using System.Linq;
using System.Threading.Tasks;
using Avalonia.Platform.Storage;

namespace AgiBuild.Audixa.Platform;

public sealed class AvaloniaLocalMediaPicker : ILocalMediaPicker
{
    private readonly IWindowContext _windowContext;

    public AvaloniaLocalMediaPicker(IWindowContext windowContext)
    {
        _windowContext = windowContext;
    }

    public async Task<Uri?> PickVideoAsync()
    {
        var window = _windowContext.MainWindow;
        if (window is null)
            return null;

        var mp4Type = new FilePickerFileType("MP4 video")
        {
            Patterns = new[] { "*.mp4" },
            MimeTypes = new[] { "video/mp4" }
        };

        var files = await window.StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            AllowMultiple = false,
            Title = "Open video (MVP: MP4 only)",
            FileTypeFilter = new[] { mp4Type }
        });

        return files.FirstOrDefault()?.Path;
    }
}


