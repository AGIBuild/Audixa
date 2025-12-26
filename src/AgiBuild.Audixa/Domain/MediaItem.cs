using System;

namespace AgiBuild.Audixa.Domain;

public sealed record MediaItem(
    string Id,
    string DisplayName,
    MediaSourceKind SourceKind,
    string SourceLocator,
    TimeSpan? Duration);

public enum MediaSourceKind
{
    Local = 0,
    Smb = 1,
}


