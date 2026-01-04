using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AgiBuild.Audixa.Sources;

public interface ISmbBrowser
{
    Task<SmbBrowsePage> ListAsync(SmbBrowseRequest request, CancellationToken ct = default);
}

public sealed record SmbBrowseRequest(
    string Host,
    string Share,
    string Path,
    string? Username,
    string? Domain,
    string? SecretId,
    int PageSize = 200,
    string? ContinuationToken = null,
    bool ForceRefresh = false);

public sealed record SmbBrowsePage(
    IReadOnlyList<SmbBrowseEntry> Items,
    string? ContinuationToken);

public sealed record SmbBrowseEntry(
    string Name,
    bool IsDirectory);


