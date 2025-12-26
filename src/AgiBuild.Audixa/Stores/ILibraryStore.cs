using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Stores;

public interface ILibraryStore
{
    Task UpsertMediaAsync(MediaItem item, DateTimeOffset playedAtUtc);
    Task SaveProgressAsync(string mediaItemId, TimeSpan position, DateTimeOffset updatedAtUtc);
    Task<TimeSpan?> GetLastPositionAsync(string mediaItemId);
    Task<IReadOnlyList<MediaItem>> GetRecentAsync(int limit);
}


