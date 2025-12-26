using System.Collections.Generic;

namespace AgiBuild.Audixa.Domain;

public sealed record Playlist(string Id, string Name, IReadOnlyList<MediaItem> Items);


