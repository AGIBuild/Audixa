using System;

namespace AgiBuild.Audixa.Domain;

public sealed record SubtitleCue(TimeSpan Start, TimeSpan End, string Text);


