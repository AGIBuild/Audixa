using System;
using System.Globalization;
using System.IO;
using System.Net;
using AgiBuild.Audixa.Services;
using Avalonia.Controls;

namespace AgiBuild.Audixa.Desktop.Video;

public sealed class WebView2MediaPlayerAdapter : IMediaPlayerAdapter
{
    private readonly WebView2HostControl _view = new();
    private readonly LocalHttpFileProxy _localProxy = new();

    public Control View => _view;

    public event EventHandler<TimeSpan>? PositionChanged;
    public event EventHandler<TimeSpan?>? DurationChanged;
    public event EventHandler<string>? ErrorRaised;

    public WebView2MediaPlayerAdapter()
    {
        _view.MessageReceived += OnMessage;
        _view.InitializeWithVideoPage();
    }

    public void Open(PlaybackInput input)
    {
        // Spike: only handle direct file Uri and http proxy url.
        if (input is DirectUriPlaybackInput direct)
        {
            if (direct.Uri.IsFile)
            {
                var url = _localProxy.BindFile(direct.Uri.LocalPath);
                _view.SetVideoSource(url);
            }
            else
            {
                _view.SetVideoSource(direct.Uri);
            }
            return;
        }

        if (input is HttpProxyPlaybackInput http)
        {
            _view.SetVideoSource(http.Url);
            return;
        }

        ErrorRaised?.Invoke(this, $"Unsupported playback input: {input.GetType().Name}");
    }

    public void Play() => _view.Play();
    public void Pause() => _view.Pause();
    public void Seek(TimeSpan position) => _view.Seek(position);
    public void SetSpeed(double speed) => _view.SetSpeed(speed);

    private void OnMessage(object? sender, string message)
    {
        // message is a compact "type:value" or json in future.
        // For now we accept:
        // - "time:12.345"
        // - "duration:123.456"
        // - "error:..."
        if (message.StartsWith("time:", StringComparison.Ordinal))
        {
            if (double.TryParse(message.AsSpan(5), NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds))
            {
                PositionChanged?.Invoke(this, TimeSpan.FromSeconds(seconds));
            }
            return;
        }

        if (message.StartsWith("duration:", StringComparison.Ordinal))
        {
            if (double.TryParse(message.AsSpan(9), NumberStyles.Float, CultureInfo.InvariantCulture, out var seconds))
            {
                DurationChanged?.Invoke(this, TimeSpan.FromSeconds(seconds));
            }
            return;
        }

        if (message.StartsWith("error:", StringComparison.Ordinal))
        {
            ErrorRaised?.Invoke(this, message[6..]);
        }
    }

    private sealed class LocalHttpFileProxy : IDisposable
    {
        private readonly HttpListener _listener = new();
        private readonly int _port;
        private volatile string? _filePath;

        public LocalHttpFileProxy()
        {
            _port = GetFreeTcpPort();
            var prefix = $"http://127.0.0.1:{_port}/";
            _listener.Prefixes.Add(prefix);
            _listener.Start();
            _ = ListenLoop();
        }

        public Uri BindFile(string filePath)
        {
            _filePath = filePath;
            return new Uri($"http://127.0.0.1:{_port}/video");
        }

        public void Dispose()
        {
            try { _listener.Stop(); } catch { }
            try { _listener.Close(); } catch { }
        }

        private async System.Threading.Tasks.Task ListenLoop()
        {
            while (_listener.IsListening)
            {
                HttpListenerContext? ctx = null;
                try
                {
                    ctx = await _listener.GetContextAsync().ConfigureAwait(false);
                    await Handle(ctx).ConfigureAwait(false);
                }
                catch
                {
                    try { ctx?.Response.OutputStream.Close(); } catch { }
                }
            }
        }

        private async System.Threading.Tasks.Task Handle(HttpListenerContext ctx)
        {
            if (!string.Equals(ctx.Request.Url?.AbsolutePath, "/video", StringComparison.OrdinalIgnoreCase))
            {
                ctx.Response.StatusCode = 404;
                ctx.Response.Close();
                return;
            }

            var path = _filePath;
            if (path is null || !File.Exists(path))
            {
                ctx.Response.StatusCode = 404;
                ctx.Response.Close();
                return;
            }

            ctx.Response.Headers["Accept-Ranges"] = "bytes";
            ctx.Response.ContentType = "video/mp4";

            var fileInfo = new FileInfo(path);
            var total = fileInfo.Length;

            var range = ctx.Request.Headers["Range"];
            if (!string.IsNullOrWhiteSpace(range) && range.StartsWith("bytes=", StringComparison.OrdinalIgnoreCase))
            {
                var (start, end) = ParseRange(range, total);
                if (start < 0 || start >= total)
                {
                    ctx.Response.StatusCode = 416;
                    ctx.Response.Close();
                    return;
                }

                var length = end - start + 1;
                ctx.Response.StatusCode = 206;
                ctx.Response.Headers["Content-Range"] = $"bytes {start}-{end}/{total}";
                ctx.Response.ContentLength64 = length;

                await using var fs = File.OpenRead(path);
                fs.Seek(start, SeekOrigin.Begin);
                await CopyFixedLength(fs, ctx.Response.OutputStream, length).ConfigureAwait(false);
                ctx.Response.OutputStream.Close();
                return;
            }

            ctx.Response.StatusCode = 200;
            ctx.Response.ContentLength64 = total;
            await using (var fs = File.OpenRead(path))
            {
                await fs.CopyToAsync(ctx.Response.OutputStream).ConfigureAwait(false);
            }
            ctx.Response.OutputStream.Close();
        }

        private static (long start, long end) ParseRange(string header, long total)
        {
            // bytes=start-end
            var spec = header["bytes=".Length..].Trim();
            var parts = spec.Split('-', 2);
            if (parts.Length != 2)
                return (0, total - 1);

            if (long.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var start))
            {
                if (long.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var end))
                {
                    end = Math.Min(end, total - 1);
                    return (start, end);
                }

                return (start, total - 1);
            }

            return (0, total - 1);
        }

        private static async System.Threading.Tasks.Task CopyFixedLength(Stream input, Stream output, long length)
        {
            var buffer = new byte[64 * 1024];
            long remaining = length;
            while (remaining > 0)
            {
                var read = await input.ReadAsync(buffer, 0, (int)Math.Min(buffer.Length, remaining)).ConfigureAwait(false);
                if (read <= 0)
                    break;
                await output.WriteAsync(buffer, 0, read).ConfigureAwait(false);
                remaining -= read;
            }
        }

        private static int GetFreeTcpPort()
        {
            var listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
            listener.Start();
            var port = ((System.Net.IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();
            return port;
        }
    }
}


