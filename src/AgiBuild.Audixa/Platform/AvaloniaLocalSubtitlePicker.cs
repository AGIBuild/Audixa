using System;
using System.Linq;
using System.Threading.Tasks;
using Avalonia.Platform.Storage;

namespace AgiBuild.Audixa.Platform;

public sealed class AvaloniaLocalSubtitlePicker : ILocalSubtitlePicker
{
    private readonly IWindowContext _windowContext;

    public AvaloniaLocalSubtitlePicker(IWindowContext windowContext)
    {
        _windowContext = windowContext;
    }

    public async Task<Uri?> PickSubtitleAsync()
    {
        var window = _windowContext.MainWindow;
        if (window is null)
            return null;

        var srt = new FilePickerFileType("SRT subtitle") { Patterns = new[] { "*.srt" } };
        var vtt = new FilePickerFileType("WebVTT subtitle") { Patterns = new[] { "*.vtt" } };

        var files = await window.StorageProvider.OpenFilePickerAsync(new FilePickerOpenOptions
        {
            AllowMultiple = false,
            Title = "Open subtitle (SRT/VTT)",
            FileTypeFilter = new[] { srt, vtt }
        });

        return files.FirstOrDefault()?.Path;
    }
}


