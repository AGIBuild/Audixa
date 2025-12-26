using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Services;

namespace AgiBuild.Audixa.Sources;

public sealed record MediaOpenRequest(MediaItem Item, PlaybackInput Input);


