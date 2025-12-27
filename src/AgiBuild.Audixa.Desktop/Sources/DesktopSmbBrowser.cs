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
    public Task<IReadOnlyList<SmbBrowseEntry>> ListAsync(SmbBrowseRequest request, CancellationToken ct = default)
    {
        // Desktop MVP: use local filesystem / UNC via File APIs (auth via OS).
        var basePath = $@"\\{request.Host}\{request.Share}";
        var rel = SmbPath.NormalizeRelativePath(request.Path);
        var fullPath = string.IsNullOrEmpty(rel) ? basePath : Path.Combine(basePath, rel);

        var list = Directory.EnumerateFileSystemEntries(fullPath)
            .Select(p =>
            {
                var name = Path.GetFileName(p);
                var isDir = Directory.Exists(p);
                return new SmbBrowseEntry(name, isDir);
            })
            .OrderByDescending(e => e.IsDirectory)
            .ThenBy(e => e.Name, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return Task.FromResult<IReadOnlyList<SmbBrowseEntry>>(list);
    }
}


