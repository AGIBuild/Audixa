using System;

namespace AgiBuild.Audixa.Domain;

public sealed record SubtitleLine(
    TimeSpan Start,
    TimeSpan End,
    string Text);


