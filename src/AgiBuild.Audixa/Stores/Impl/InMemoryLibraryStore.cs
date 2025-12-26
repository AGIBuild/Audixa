using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Stores.Impl;

public sealed class InMemoryLibraryStore : ILibraryStore
{
    private readonly Dictionary<string, MediaItem> _items = new();
    private readonly Dictionary<string, TimeSpan> _pos = new();
    private readonly List<(DateTimeOffset playedAtUtc, string id)> _recents = new();

    public Task UpsertMediaAsync(MediaItem item, DateTimeOffset playedAtUtc)
    {
        _items[item.Id] = item;
        _recents.RemoveAll(x => x.id == item.Id);
        _recents.Add((playedAtUtc, item.Id));
        return Task.CompletedTask;
    }

    public Task SaveProgressAsync(string mediaItemId, TimeSpan position, DateTimeOffset updatedAtUtc)
    {
        _pos[mediaItemId] = position;
        return Task.CompletedTask;
    }

    public Task<TimeSpan?> GetLastPositionAsync(string mediaItemId)
    {
        return Task.FromResult(_pos.TryGetValue(mediaItemId, out var p) ? (TimeSpan?)p : null);
    }

    public Task<IReadOnlyList<MediaItem>> GetRecentAsync(int limit)
    {
        var list = _recents
            .OrderByDescending(x => x.playedAtUtc)
            .Select(x => x.id)
            .Distinct()
            .Select(id => _items.TryGetValue(id, out var item) ? item : null)
            .Where(x => x is not null)
            .Take(limit)
            .Cast<MediaItem>()
            .ToList();
        return Task.FromResult((IReadOnlyList<MediaItem>)list);
    }
}


