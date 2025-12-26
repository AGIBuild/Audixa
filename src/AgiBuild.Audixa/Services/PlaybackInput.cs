using System;
using System.IO;

namespace AgiBuild.Audixa.Services;

public abstract record PlaybackInput;

public sealed record DirectUriPlaybackInput(Uri Uri) : PlaybackInput;

public sealed record SeekableStreamPlaybackInput(Func<Stream> OpenStream) : PlaybackInput;

public sealed record HttpProxyPlaybackInput(Uri Url) : PlaybackInput;


