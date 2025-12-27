using AgiBuild.Audixa.Sources;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class SmbPathTests
{
    [Theory]
    [InlineData(@"\\server\share", "server", "share")]
    [InlineData(@"\\server\share\", "server", "share")]
    [InlineData(@"\\server\share\folder", "server", "share")]
    public void TryParseRoot_Unc_Works(string input, string host, string share)
    {
        Assert.True(SmbPath.TryParseRoot(input, out var h, out var s));
        Assert.Equal(host, h);
        Assert.Equal(share, s);
    }

    [Theory]
    [InlineData("smb://server/share", "server", "share")]
    [InlineData("smb://server/share/", "server", "share")]
    [InlineData("smb://server/share/folder", "server", "share")]
    public void TryParseRoot_SmbUri_Works(string input, string host, string share)
    {
        Assert.True(SmbPath.TryParseRoot(input, out var h, out var s));
        Assert.Equal(host, h);
        Assert.Equal(share, s);
    }

    [Theory]
    [InlineData("")]
    [InlineData("  ")]
    [InlineData("server/share")]
    [InlineData("http://server/share")]
    [InlineData(@"\\server")]
    public void TryParseRoot_Invalid_ReturnsFalse(string input)
    {
        Assert.False(SmbPath.TryParseRoot(input, out _, out _));
    }

    [Theory]
    [InlineData("", "")]
    [InlineData(@"\", "")]
    [InlineData(@"\\", "")]
    [InlineData(@"folder", "folder")]
    [InlineData(@"folder\", "folder")]
    [InlineData(@"/folder/sub/", @"folder\sub")]
    [InlineData(@"folder/sub", @"folder\sub")]
    public void NormalizeRelativePath_Works(string input, string expected)
    {
        Assert.Equal(expected, SmbPath.NormalizeRelativePath(input));
    }

    [Fact]
    public void BuildStableLocator_UsesForwardSlashes_AndNoQuery()
    {
        var loc = SmbPath.BuildStableLocator("server", "share", @"folder\file.mp4");
        Assert.Equal("smb://server/share/folder/file.mp4", loc);
    }
}


