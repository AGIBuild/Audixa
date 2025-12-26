using System;
using System.Threading.Tasks;

namespace AgiBuild.Audixa.Platform;

public interface ILocalSubtitlePicker
{
    Task<Uri?> PickSubtitleAsync();
}


