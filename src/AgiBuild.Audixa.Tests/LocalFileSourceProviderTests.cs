using System;
using System.IO;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Sources.Impl;
using Xunit;

namespace AgiBuild.Audixa.Tests;

public sealed class LocalFileSourceProviderTests
{
    [Fact]
    public async Task PickSingle_ReturnsMediaOpenRequest()
    {
        var uri = new Uri("file:///C:/temp/a.mp4");
        var picker = new FakePicker(uri);
        var src = new LocalFileSourceProvider(picker);

        var req = await src.PickSingleAsync();

        Assert.NotNull(req);
        Assert.Equal(MediaSourceKind.Local, req!.Item.SourceKind);
        Assert.Equal(uri.ToString(), req.Item.SourceLocator);
        Assert.IsType<Services.DirectUriPlaybackInput>(req.Input);
    }

    private sealed class FakePicker : ILocalMediaPicker
    {
        private readonly Uri _uri;
        public FakePicker(Uri uri) => _uri = uri;
        public Task<Uri?> PickVideoAsync() => Task.FromResult<Uri?>(_uri);
    }
}


