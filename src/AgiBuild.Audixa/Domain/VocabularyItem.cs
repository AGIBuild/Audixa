using System;

namespace AgiBuild.Audixa.Domain;

public sealed record VocabularyItem(
    string Id,
    string Word,
    string? Context,
    string? SourceMediaItemId,
    DateTimeOffset UpdatedAtUtc,
    bool Deleted);


