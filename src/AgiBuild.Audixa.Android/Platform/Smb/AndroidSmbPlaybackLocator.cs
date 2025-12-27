using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Versioning;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Sources;

namespace AgiBuild.Audixa.Android.Platform.Smb;

[SupportedOSPlatform("android21.0")]
public sealed class AndroidSmbPlaybackLocator : ISmbPlaybackLocator
{
    public Uri CreatePlaybackUri(string host, string share, string relativePath, SmbProfile profile)
    {
        var rel = SmbPath.NormalizeRelativePath(relativePath).Replace('\\', '/');
        var path = string.IsNullOrEmpty(rel) ? $"/{share}" : $"/{share}/{rel}";

        var q = new Dictionary<string, string?>(StringComparer.Ordinal)
        {
            ["user"] = profile.Username,
            ["domain"] = profile.Domain,
            ["secretId"] = profile.SecretId,
        };
        var query = string.Join("&",
            q.Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
                .Select(kv => $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value!)}"));

        var b = new UriBuilder
        {
            Scheme = "smb",
            Host = host,
            Path = path,
            Query = query,
        };

        return b.Uri;
    }
}


