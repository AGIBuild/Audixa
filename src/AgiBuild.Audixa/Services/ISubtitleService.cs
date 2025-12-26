using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Services;

public interface ISubtitleService
{
    Task<IReadOnlyList<SubtitleCue>> ParseAsync(Stream stream, SubtitleFormat format);
}

public enum SubtitleFormat
{
    Srt = 0,
    Vtt = 1,
}


