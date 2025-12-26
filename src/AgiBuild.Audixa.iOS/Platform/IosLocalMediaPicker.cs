using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Platform;

namespace AgiBuild.Audixa.iOS.Platform;

public sealed class IosLocalMediaPicker : ILocalMediaPicker
{
    public Task<Uri?> PickVideoAsync()
    {
        // MVP: prefer MP4.
        return IosDocumentPickerHost.PickSingleAsync(
            allowedUtis: new[] { "public.mpeg-4", "public.movie" },
            fallbackExtension: "mp4");
    }
}


