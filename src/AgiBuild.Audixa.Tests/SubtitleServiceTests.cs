using System.IO;
using System.Text;
using System.Threading.Tasks;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Services.Impl;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class SubtitleServiceTests
{
    [Fact]
    public async Task ParseSrt_Basic()
    {
        var srt = """
1
00:00:01,000 --> 00:00:02,500
Hello

2
00:00:03,000 --> 00:00:04,000
World
""";

        var svc = new SubtitleService();
        await using var ms = new MemoryStream(Encoding.UTF8.GetBytes(srt));
        var cues = await svc.ParseAsync(ms, SubtitleFormat.Srt);

        Assert.Equal(2, cues.Count);
        Assert.Equal("Hello", cues[0].Text);
        Assert.Equal(1000, (int)cues[0].Start.TotalMilliseconds);
        Assert.Equal(2500, (int)cues[0].End.TotalMilliseconds);
    }

    [Fact]
    public async Task ParseVtt_WithHeaderAndCueId()
    {
        var vtt = """
WEBVTT

cue-1
00:01.000 --> 00:02.500
Hello

00:03.000 --> 00:04.000
World
""";

        var svc = new SubtitleService();
        await using var ms = new MemoryStream(Encoding.UTF8.GetBytes(vtt));
        var cues = await svc.ParseAsync(ms, SubtitleFormat.Vtt);

        Assert.Equal(2, cues.Count);
        Assert.Equal("World", cues[1].Text);
        Assert.Equal(1000, (int)cues[0].Start.TotalMilliseconds);
    }

    [Fact]
    public async Task ParseSrt_MultilineText_IsPreserved()
    {
        var srt = """
1
00:00:01,000 --> 00:00:02,500
Hello
World

""";

        var svc = new SubtitleService();
        await using var ms = new MemoryStream(Encoding.UTF8.GetBytes(srt));
        var cues = await svc.ParseAsync(ms, SubtitleFormat.Srt);

        Assert.Single(cues);
        Assert.Equal("Hello\nWorld", cues[0].Text);
    }

    [Fact]
    public async Task ParseVtt_WithoutHours_Works()
    {
        var vtt = """
00:01.000 --> 00:02.500
Hello
""";

        var svc = new SubtitleService();
        await using var ms = new MemoryStream(Encoding.UTF8.GetBytes(vtt));
        var cues = await svc.ParseAsync(ms, SubtitleFormat.Vtt);

        Assert.Single(cues);
        Assert.Equal(1000, (int)cues[0].Start.TotalMilliseconds);
        Assert.Equal(2500, (int)cues[0].End.TotalMilliseconds);
    }
}


