using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Services.Impl;

public sealed class SubtitleService : ISubtitleService
{
    public async Task<IReadOnlyList<SubtitleCue>> ParseAsync(Stream stream, SubtitleFormat format)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
        var text = await reader.ReadToEndAsync().ConfigureAwait(false);

        return format switch
        {
            SubtitleFormat.Srt => ParseSrt(text),
            SubtitleFormat.Vtt => ParseVtt(text),
            _ => Array.Empty<SubtitleCue>()
        };
    }

    private static IReadOnlyList<SubtitleCue> ParseSrt(string text)
    {
        // Very small SRT parser:
        // - index line optional
        // - time line: "00:00:12,345 --> 00:00:14,000"
        // - text lines until blank
        var cues = new List<SubtitleCue>();
        var lines = SplitLines(text);

        for (var i = 0; i < lines.Count;)
        {
            // Skip blank
            if (string.IsNullOrWhiteSpace(lines[i]))
            {
                i++;
                continue;
            }

            // Optional numeric index
            if (IsAllDigits(lines[i]))
                i++;

            if (i >= lines.Count)
                break;

            if (!TryParseTimeRange(lines[i], isVtt: false, out var start, out var end))
            {
                i++;
                continue;
            }
            i++;

            var sb = new StringBuilder();
            while (i < lines.Count && !string.IsNullOrWhiteSpace(lines[i]))
            {
                if (sb.Length > 0)
                    sb.AppendLine();
                sb.Append(lines[i]);
                i++;
            }

            cues.Add(new SubtitleCue(start, end, sb.ToString()));
        }

        return cues;
    }

    private static IReadOnlyList<SubtitleCue> ParseVtt(string text)
    {
        // Minimal WebVTT parser:
        // - optional "WEBVTT" header
        // - time line: "00:00:12.345 --> 00:00:14.000" (or without hours)
        var cues = new List<SubtitleCue>();
        var lines = SplitLines(text);

        var i = 0;
        if (i < lines.Count && lines[i].StartsWith("WEBVTT", StringComparison.OrdinalIgnoreCase))
        {
            i++;
        }

        for (; i < lines.Count;)
        {
            if (string.IsNullOrWhiteSpace(lines[i]))
            {
                i++;
                continue;
            }

            // Optional cue id
            if (!lines[i].Contains("-->", StringComparison.Ordinal))
                i++;

            if (i >= lines.Count)
                break;

            if (!TryParseTimeRange(lines[i], isVtt: true, out var start, out var end))
            {
                i++;
                continue;
            }
            i++;

            var sb = new StringBuilder();
            while (i < lines.Count && !string.IsNullOrWhiteSpace(lines[i]))
            {
                if (sb.Length > 0)
                    sb.AppendLine();
                sb.Append(lines[i]);
                i++;
            }

            cues.Add(new SubtitleCue(start, end, sb.ToString()));
        }

        return cues;
    }

    private static List<string> SplitLines(string text)
    {
        var list = new List<string>();
        using var sr = new StringReader(text);
        string? line;
        while ((line = sr.ReadLine()) is not null)
        {
            list.Add(line.TrimEnd('\r'));
        }
        return list;
    }

    private static bool IsAllDigits(string s)
    {
        for (var i = 0; i < s.Length; i++)
        {
            if (!char.IsDigit(s[i]))
                return false;
        }
        return s.Length > 0;
    }

    private static bool TryParseTimeRange(string line, bool isVtt, out TimeSpan start, out TimeSpan end)
    {
        start = default;
        end = default;

        var parts = line.Split("-->", 2, StringSplitOptions.TrimEntries);
        if (parts.Length != 2)
            return false;

        // Ignore any trailing settings on the end time (VTT)
        var endPart = parts[1];
        var spaceIdx = endPart.IndexOf(' ');
        if (spaceIdx > 0)
            endPart = endPart[..spaceIdx];

        return TryParseTime(parts[0], isVtt, out start) && TryParseTime(endPart, isVtt, out end);
    }

    private static bool TryParseTime(string s, bool isVtt, out TimeSpan time)
    {
        time = default;
        s = s.Trim();

        // SRT: HH:MM:SS,mmm
        // VTT: HH:MM:SS.mmm or MM:SS.mmm
        if (!isVtt)
        {
            // Normalize comma to dot for parsing
            s = s.Replace(',', '.');
        }

        // Ensure we have hours for TimeSpan parsing: H:MM:SS.fff
        var colonCount = 0;
        for (var i = 0; i < s.Length; i++)
        {
            if (s[i] == ':')
                colonCount++;
        }
        if (colonCount == 1)
        {
            s = "00:" + s;
        }

        // Accept format like 00:00:12.345
        return TimeSpan.TryParseExact(
            s,
            new[] { @"hh\:mm\:ss\.fff", @"h\:mm\:ss\.fff", @"hh\:mm\:ss", @"h\:mm\:ss" },
            CultureInfo.InvariantCulture,
            out time);
    }
}


