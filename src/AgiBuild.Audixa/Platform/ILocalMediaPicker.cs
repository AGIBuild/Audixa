using System;
using System.Threading.Tasks;

namespace AgiBuild.Audixa.Platform;

public interface ILocalMediaPicker
{
    Task<Uri?> PickVideoAsync();
}


