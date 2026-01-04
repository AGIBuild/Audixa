using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AgiBuild.Audixa.Sources.Impl;

public sealed class CachedSmbBrowser : ISmbBrowser
{
    private readonly ISmbBrowser _inner;
    private readonly SmbBrowseCache _cache;

    public CachedSmbBrowser(ISmbBrowser inner, SmbBrowseCache cache)
    {
        _inner = inner;
        _cache = cache;
    }

    public async Task<SmbBrowsePage> ListAsync(SmbBrowseRequest request, CancellationToken ct = default)
    {
        var key = BuildKey(request);

        if (!request.ForceRefresh && _cache.TryGet(key, out var cached))
            return cached;

        var fresh = await _inner.ListAsync(request, ct).ConfigureAwait(false);
        _cache.Set(key, fresh);
        return fresh;
    }

    private static string BuildKey(SmbBrowseRequest req)
    {
        // Include credential identity to avoid cross-credential leakage.
        // SecretId is an opaque id, not a secret value.
        return string.Join("|",
            (req.Host ?? string.Empty).Trim().ToLowerInvariant(),
            (req.Share ?? string.Empty).Trim().ToLowerInvariant(),
            (req.Path ?? string.Empty).Trim().ToLowerInvariant(),
            req.PageSize.ToString(),
            (req.ContinuationToken ?? string.Empty).Trim(),
            (req.Username ?? string.Empty).Trim().ToLowerInvariant(),
            (req.Domain ?? string.Empty).Trim().ToLowerInvariant(),
            (req.SecretId ?? string.Empty).Trim());
    }
}


