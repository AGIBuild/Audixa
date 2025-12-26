using System;
using System.Threading.Tasks;
using AgiBuild.Audixa.Platform;

namespace AgiBuild.Audixa.Android.Platform;

public sealed class AndroidLocalMediaPicker : ILocalMediaPicker
{
    public async Task<Uri?> PickVideoAsync()
    {
        var uri = await AndroidPickerHost.PickVideoAsync();
        return uri is null ? null : new Uri(uri.ToString()!);
    }
}


