using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AgiBuild.Audixa.Sources;

namespace AgiBuild.Audixa.Desktop.Sources;

public sealed class DesktopSmbBrowser : ISmbBrowser
{
    public Task<SmbBrowsePage> ListAsync(SmbBrowseRequest request, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();

        // Desktop MVP: use local filesystem / UNC via File APIs (auth via OS).
        var basePath = $@"\\{request.Host}\{request.Share}";
        var rel = SmbPath.NormalizeRelativePath(request.Path);
        var fullPath = string.IsNullOrEmpty(rel) ? basePath : Path.Combine(basePath, rel);

        var offset = ParseOffset(request.ContinuationToken);
        var pageSize = request.PageSize <= 0 ? 200 : request.PageSize;

        var items = new List<SmbBrowseEntry>(pageSize);
        var seen = 0;
        var returned = 0;
        var hasMore = false;

        foreach (var p in Directory.EnumerateFileSystemEntries(fullPath))
        {
            ct.ThrowIfCancellationRequested();

            if (seen++ < offset)
                continue;

            if (returned >= pageSize)
            {
                hasMore = true;
                break;
            }

            var name = Path.GetFileName(p);
            var isDir = Directory.Exists(p);
            items.Add(new SmbBrowseEntry(name, isDir));
            returned++;
        }

        ct.ThrowIfCancellationRequested();

        var nextToken = hasMore ? (offset + returned).ToString() : null;
        return Task.FromResult(new SmbBrowsePage(items, nextToken));
    }

    private static int ParseOffset(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return 0;
        return int.TryParse(token, out var n) && n > 0 ? n : 0;
    }
}


