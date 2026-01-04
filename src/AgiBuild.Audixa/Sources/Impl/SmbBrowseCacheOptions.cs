using System;

namespace AgiBuild.Audixa.Sources.Impl;

public sealed record SmbBrowseCacheOptions(
    TimeSpan Ttl,
    int Capacity)
{
    public static SmbBrowseCacheOptions Default { get; } = new(TimeSpan.FromSeconds(5), 64);
}


