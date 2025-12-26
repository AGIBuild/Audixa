using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Platform;

namespace AgiBuild.Audixa.iOS.Platform;

public sealed class IosLocalSubtitlePicker : ILocalSubtitlePicker
{
    public Task<Uri?> PickSubtitleAsync()
    {
        // MVP: accept text files. Users can pick .srt/.vtt.
        return IosDocumentPickerHost.PickSingleAsync(
            allowedUtis: new[] { "public.text", "public.plain-text" },
            fallbackExtension: "srt");
    }
}


