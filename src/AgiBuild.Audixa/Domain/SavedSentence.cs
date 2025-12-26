using System;

namespace AgiBuild.Audixa.Domain;

public sealed record SavedSentence(
    string Id,
    string MediaItemId,
    TimeSpan Start,
    TimeSpan End,
    string PrimaryText,
    string? SecondaryText,
    DateTimeOffset UpdatedAtUtc,
    bool Deleted);


