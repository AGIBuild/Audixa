using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace AgiBuild.Audixa.Sources.Impl;

public sealed class NullSmbBrowser : ISmbBrowser
{
    public Task<SmbBrowsePage> ListAsync(SmbBrowseRequest request, CancellationToken ct = default) =>
        throw new NotSupportedException("SMB browsing is not configured for this platform.");
}


