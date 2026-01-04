using System;
using System.Collections.Generic;

namespace AgiBuild.Audixa.Sources.Impl;

/// <summary>
/// In-memory TTL + LRU cache for SMB directory listings.
/// </summary>
public sealed class SmbBrowseCache
{
    private sealed record Entry(DateTimeOffset StoredAtUtc, SmbBrowsePage Page);

    private readonly object _gate = new();
    private readonly Dictionary<string, (LinkedListNode<string> Node, Entry Entry)> _map = new(StringComparer.Ordinal);
    private readonly LinkedList<string> _lru = new();

    private readonly TimeProvider _timeProvider;
    private readonly SmbBrowseCacheOptions _options;

    public SmbBrowseCache(TimeProvider timeProvider, SmbBrowseCacheOptions options)
    {
        _timeProvider = timeProvider;
        _options = options;
        if (_options.Capacity <= 0)
            throw new ArgumentOutOfRangeException(nameof(options), "Capacity must be positive.");
        if (_options.Ttl < TimeSpan.Zero)
            throw new ArgumentOutOfRangeException(nameof(options), "Ttl must be non-negative.");
    }

    public bool TryGet(string key, out SmbBrowsePage page)
    {
        lock (_gate)
        {
            if (!_map.TryGetValue(key, out var v))
            {
                page = new SmbBrowsePage(Array.Empty<SmbBrowseEntry>(), ContinuationToken: null);
                return false;
            }

            var now = _timeProvider.GetUtcNow();
            if (now - v.Entry.StoredAtUtc > _options.Ttl)
            {
                RemoveNoLock(key, v.Node);
                page = new SmbBrowsePage(Array.Empty<SmbBrowseEntry>(), ContinuationToken: null);
                return false;
            }

            // Refresh LRU
            _lru.Remove(v.Node);
            _lru.AddFirst(v.Node);

            page = v.Entry.Page;
            return true;
        }
    }

    public void Set(string key, SmbBrowsePage page)
    {
        lock (_gate)
        {
            if (_map.TryGetValue(key, out var existing))
            {
                _lru.Remove(existing.Node);
                _map.Remove(key);
            }

            var node = _lru.AddFirst(key);
            _map[key] = (node, new Entry(_timeProvider.GetUtcNow(), page));

            while (_map.Count > _options.Capacity)
            {
                var last = _lru.Last;
                if (last is null)
                    break;
                RemoveNoLock(last.Value, last);
            }
        }
    }

    private void RemoveNoLock(string key, LinkedListNode<string> node)
    {
        _lru.Remove(node);
        _map.Remove(key);
    }
}


