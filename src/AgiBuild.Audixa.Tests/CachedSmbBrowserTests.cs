using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Sources;
using AgiBuild.Audixa.Sources.Impl;
using AgiBuild.Audixa.Tests.TestSupport;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class CachedSmbBrowserTests
{
    [Fact]
    public async Task CacheHit_ReturnsCached_AndDoesNotCallInnerAgain()
    {
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var cache = new SmbBrowseCache(time, new SmbBrowseCacheOptions(TimeSpan.FromSeconds(5), 16));

        var inner = new CountingSmbBrowser();
        inner.ItemsToReturn = new[] { new SmbBrowseEntry("a.mp4", false) };

        var cached = new CachedSmbBrowser(inner, cache);
        var req = new SmbBrowseRequest("server", "share", "", null, null, null, ForceRefresh: false);

        var a = await cached.ListAsync(req);
        var b = await cached.ListAsync(req);

        Assert.Single(a.Items);
        Assert.Single(b.Items);
        Assert.Equal(1, inner.Calls);
    }

    [Fact]
    public async Task CacheHit_ReturnsCachedContinuationToken()
    {
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var cache = new SmbBrowseCache(time, new SmbBrowseCacheOptions(TimeSpan.FromSeconds(5), 16));

        var inner = new CountingSmbBrowser();
        inner.ItemsToReturn = new[] { new SmbBrowseEntry("a.mp4", false) };
        inner.ContinuationTokenToReturn = "200";

        var cached = new CachedSmbBrowser(inner, cache);
        var req = new SmbBrowseRequest("server", "share", "", null, null, null);

        var first = await cached.ListAsync(req);
        var second = await cached.ListAsync(req);

        Assert.Equal("200", first.ContinuationToken);
        Assert.Equal("200", second.ContinuationToken);
        Assert.Equal(1, inner.Calls);
    }

    [Fact]
    public async Task ForceRefresh_BypassesCache()
    {
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var cache = new SmbBrowseCache(time, new SmbBrowseCacheOptions(TimeSpan.FromSeconds(5), 16));

        var inner = new CountingSmbBrowser();
        inner.ItemsToReturn = new[] { new SmbBrowseEntry("a.mp4", false) };

        var cached = new CachedSmbBrowser(inner, cache);
        var req = new SmbBrowseRequest("server", "share", "", null, null, null, ForceRefresh: false);

        await cached.ListAsync(req);
        await cached.ListAsync(req with { ForceRefresh = true });

        Assert.Equal(2, inner.Calls);
    }

    [Fact]
    public async Task ForceRefresh_UpdatesCache()
    {
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var cache = new SmbBrowseCache(time, new SmbBrowseCacheOptions(TimeSpan.FromSeconds(5), 16));

        var inner = new CountingSmbBrowser();
        inner.ItemsToReturn = new[] { new SmbBrowseEntry("a.mp4", false) };

        var cached = new CachedSmbBrowser(inner, cache);
        var req = new SmbBrowseRequest("server", "share", "", null, null, null, ForceRefresh: false);

        var first = await cached.ListAsync(req);
        Assert.Equal("a.mp4", first.Items[0].Name);

        inner.ItemsToReturn = new[] { new SmbBrowseEntry("b.mp4", false) };

        var refreshed = await cached.ListAsync(req with { ForceRefresh = true });
        Assert.Equal("b.mp4", refreshed.Items[0].Name);

        // Should hit cache (no third inner call)
        var again = await cached.ListAsync(req);
        Assert.Equal("b.mp4", again.Items[0].Name);
        Assert.Equal(2, inner.Calls);
    }

    [Fact]
    public async Task TtlExpired_FetchesAgain()
    {
        var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));
        var cache = new SmbBrowseCache(time, new SmbBrowseCacheOptions(TimeSpan.FromSeconds(5), 16));

        var inner = new CountingSmbBrowser();
        inner.ItemsToReturn = new[] { new SmbBrowseEntry("a.mp4", false) };

        var cached = new CachedSmbBrowser(inner, cache);
        var req = new SmbBrowseRequest("server", "share", "", null, null, null, ForceRefresh: false);

        await cached.ListAsync(req);

        time.SetUtcNow(time.GetUtcNow().AddSeconds(6));

        await cached.ListAsync(req);

        Assert.Equal(2, inner.Calls);
    }

    private sealed class CountingSmbBrowser : ISmbBrowser
    {
        public int Calls { get; private set; }
        public IReadOnlyList<SmbBrowseEntry> ItemsToReturn { get; set; } = Array.Empty<SmbBrowseEntry>();
        public string? ContinuationTokenToReturn { get; set; }

        public Task<SmbBrowsePage> ListAsync(SmbBrowseRequest request, System.Threading.CancellationToken ct = default)
        {
            Calls++;
            return Task.FromResult(new SmbBrowsePage(ItemsToReturn, ContinuationTokenToReturn));
        }
    }
}


