using System.Runtime.Versioning;
using AgiBuild.Audixa.Stores;
using AndroidX.Media3.DataSource;

namespace AgiBuild.Audixa.Android.Platform.Smb;

[SupportedOSPlatform("android21.0")]
public sealed class SmbDataSourceFactory : Java.Lang.Object, IDataSourceFactory
{
    private readonly ISecureSecretStore _secrets;

    public SmbDataSourceFactory(ISecureSecretStore secrets)
    {
        _secrets = secrets;
    }

    public IDataSource CreateDataSource() => new SmbDataSource(_secrets);
}


