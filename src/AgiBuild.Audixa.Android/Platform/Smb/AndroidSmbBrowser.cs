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

    public Task<SmbBrowsePage> ListAsync(SmbBrowseRequest request, CancellationToken ct = default)
    {
        // SMBJ bridge call is synchronous; run on thread pool.
        return Task.Run(async () =>
        {
            ct.ThrowIfCancellationRequested();

            var password = string.IsNullOrWhiteSpace(request.SecretId)
                ? null
                : await _secrets.TryGetAsync(request.SecretId).ConfigureAwait(false);

            ct.ThrowIfCancellationRequested();

            using var bridge = new SmbjBridgeInvoker();

            var path = SmbPath.NormalizeRelativePath(request.Path);

            var items = bridge.ListDirectory(
                request.Host,
                request.Share,
                path,
                request.Domain,
                request.Username,
                password);

            ct.ThrowIfCancellationRequested();

            var offset = ParseOffset(request.ContinuationToken);
            var pageSize = request.PageSize <= 0 ? 200 : request.PageSize;

            var end = Math.Min(items.Length, offset + pageSize);
            var list = new List<SmbBrowseEntry>(Math.Max(0, end - offset));
            for (var i = offset; i < end; i++)
            {
                ct.ThrowIfCancellationRequested();

                var s = items[i];
                // Protocol: "D\tname" or "F\tname"
                var parts = s.Split('\t', 2);
                var isDir = parts.Length > 0 && string.Equals(parts[0], "D", StringComparison.Ordinal);
                var name = parts.Length == 2 ? parts[1] : s;
                list.Add(new SmbBrowseEntry(name, isDir));
            }

            var nextToken = end < items.Length ? end.ToString() : null;

            ct.ThrowIfCancellationRequested();

            return new SmbBrowsePage(list, nextToken);
        }, ct);
    }

    private static int ParseOffset(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return 0;
        return int.TryParse(token, out var n) && n > 0 ? n : 0;
    }
}


