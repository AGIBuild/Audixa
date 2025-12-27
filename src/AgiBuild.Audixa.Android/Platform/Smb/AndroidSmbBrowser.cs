using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Versioning;
using System.Threading;
using System.Threading.Tasks;
using AgiBuild.Audixa.Sources;
using AgiBuild.Audixa.Stores;

namespace AgiBuild.Audixa.Android.Platform.Smb;

[SupportedOSPlatform("android21.0")]
public sealed class AndroidSmbBrowser : ISmbBrowser
{
    private readonly ISecureSecretStore _secrets;

    public AndroidSmbBrowser(ISecureSecretStore secrets)
    {
        _secrets = secrets;
    }

    public Task<IReadOnlyList<SmbBrowseEntry>> ListAsync(SmbBrowseRequest request, CancellationToken ct = default)
    {
        // SMBJ bridge call is synchronous; run on thread pool.
        return Task.Run(async () =>
        {
            ct.ThrowIfCancellationRequested();

            var password = string.IsNullOrWhiteSpace(request.SecretId)
                ? null
                : await _secrets.TryGetAsync(request.SecretId).ConfigureAwait(false);

            using var bridge = new SmbjBridgeInvoker();

            var path = request.Path.Replace('/', '\\');
            if (string.IsNullOrWhiteSpace(path))
                path = @"\";

            var items = bridge.ListDirectory(
                request.Host,
                request.Share,
                path,
                request.Domain,
                request.Username,
                password);

            var list = items
                .Select(s =>
                {
                    // Protocol: "D\tname" or "F\tname"
                    var parts = s.Split('\t', 2);
                    var isDir = parts.Length > 0 && string.Equals(parts[0], "D", StringComparison.Ordinal);
                    var name = parts.Length == 2 ? parts[1] : s;
                    return new SmbBrowseEntry(name, isDir);
                })
                .OrderByDescending(e => e.IsDirectory)
                .ThenBy(e => e.Name, StringComparer.OrdinalIgnoreCase)
                .ToList();

            return (IReadOnlyList<SmbBrowseEntry>)list;
        }, ct);
    }
}


