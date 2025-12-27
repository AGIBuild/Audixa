using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AgiBuild.Audixa.Sources;

public interface ISmbBrowser
{
    Task<IReadOnlyList<SmbBrowseEntry>> ListAsync(SmbBrowseRequest request, CancellationToken ct = default);
}

public sealed record SmbBrowseRequest(
    string Host,
    string Share,
    string Path,
    string? Username,
    string? Domain,
    string? SecretId);

public sealed record SmbBrowseEntry(
    string Name,
    bool IsDirectory);


