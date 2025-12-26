using System;

namespace AgiBuild.Audixa.Domain;

public sealed record SmbProfile(
    string Id,
    string Name,
    string RootPath,
    DateTimeOffset UpdatedAtUtc,
    bool Deleted);


