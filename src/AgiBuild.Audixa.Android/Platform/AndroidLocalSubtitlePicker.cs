using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Platform;

namespace AgiBuild.Audixa.Android.Platform;

public sealed class AndroidLocalSubtitlePicker : ILocalSubtitlePicker
{
    public async Task<Uri?> PickSubtitleAsync()
    {
        var uri = await AndroidPickerHost.PickSubtitleAsync();
        return uri is null ? null : new Uri(uri.ToString()!);
    }
}


