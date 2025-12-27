using System;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Sources;

namespace AgiBuild.Audixa.Desktop.Sources;

public sealed class DesktopSmbPlaybackLocator : ISmbPlaybackLocator
{
    public Uri CreatePlaybackUri(string host, string share, string relativePath, SmbProfile profile)
    {
        var rel = SmbPath.NormalizeRelativePath(relativePath);
        var unc = string.IsNullOrEmpty(rel)
            ? $@"\\{host}\{share}"
            : $@"\\{host}\{share}\{rel}";

        // UNC -> file://server/share/path
        return new Uri("file:" + unc.Replace("\\", "/"));
    }
}


