using System;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Platform;
using Avalonia.Threading;
using Microsoft.Web.WebView2.Core;

namespace AgiBuild.Audixa.Desktop.Video;

public sealed class WebView2HostControl : NativeControlHost
{
    private IntPtr _hostHwnd;
    private CoreWebView2Controller? _controller;
    private bool _useVideoBootstrap;
    private readonly System.Collections.Concurrent.ConcurrentQueue<string> _pendingScripts = new();

    public event EventHandler<string>? MessageReceived;

    public WebView2HostControl()
    {
        ClipToBounds = true;
    }

    public void InitializeWithVideoPage()
    {
        _useVideoBootstrap = true;
        RunWhenReady(() => _controller?.CoreWebView2.NavigateToString(GetVideoHtml()));
    }

    public void SetVideoSource(Uri uri)
    {
        var url = uri.ToString().Replace("'", "\\'", StringComparison.Ordinal);
        RunScript($"window.audixa.setSource('{url}');");
    }

    public void Play() => RunScript("window.audixa.play();");
    public void Pause() => RunScript("window.audixa.pause();");
    public void Seek(TimeSpan position) => RunScript($"window.audixa.seek({position.TotalSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture)});");
    public void SetSpeed(double speed) => RunScript($"window.audixa.speed({speed.ToString(System.Globalization.CultureInfo.InvariantCulture)});");

    protected override IPlatformHandle CreateNativeControlCore(IPlatformHandle parent)
    {
        _hostHwnd = CreateHostWindow(parent.Handle);
        Dispatcher.UIThread.Post(async () => await InitializeAsync(_hostHwnd));
        return new PlatformHandle(_hostHwnd, "HWND");
    }

    protected override void DestroyNativeControlCore(IPlatformHandle control)
    {
        try
        {
            _controller?.Close();
            _controller = null;
        }
        catch
        {
            // ignore
        }

        if (_hostHwnd != IntPtr.Zero)
        {
            DestroyWindow(_hostHwnd);
            _hostHwnd = IntPtr.Zero;
        }
    }

    protected override Size ArrangeOverride(Size finalSize)
    {
        UpdateBounds(finalSize);
        return base.ArrangeOverride(finalSize);
    }

    private async Task InitializeAsync(IntPtr hostHwnd)
    {
        try
        {
            var env = await CoreWebView2Environment.CreateAsync();
            _controller = await env.CreateCoreWebView2ControllerAsync(hostHwnd);
            _controller.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            _controller.CoreWebView2.Settings.AreDevToolsEnabled = true;
            _controller.CoreWebView2.Settings.IsStatusBarEnabled = false;
            _controller.CoreWebView2.Settings.IsZoomControlEnabled = false;

            _controller.CoreWebView2.WebMessageReceived += (_, e) =>
            {
                var msg = e.TryGetWebMessageAsString();
                if (!string.IsNullOrWhiteSpace(msg))
                {
                    MessageReceived?.Invoke(this, msg);
                }
            };

            if (_useVideoBootstrap)
            {
                _controller.CoreWebView2.NavigateToString(GetVideoHtml());
            }
            else
            {
                _controller.CoreWebView2.NavigateToString(GetBootstrapHtml());
            }

            UpdateBounds(Bounds.Size);

            while (_pendingScripts.TryDequeue(out var script))
            {
                _ = _controller.CoreWebView2.ExecuteScriptAsync(script);
            }
        }
        catch
        {
            // Best-effort spike; failures will be surfaced later via NotificationService.
        }
    }

    private void UpdateBounds(Size size)
    {
        if (_controller is null)
            return;

        var w = Math.Max(0, (int)Math.Round(size.Width));
        var h = Math.Max(0, (int)Math.Round(size.Height));
        _controller.Bounds = new System.Drawing.Rectangle(0, 0, w, h);
    }

    private static string GetBootstrapHtml()
    {
        // Minimal page; later we will inject an HTML5 <video> element and control it via JS bridge.
        return """
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html, body { margin:0; padding:0; height:100%; background:#000; }
    .center { height:100%; display:flex; align-items:center; justify-content:center; color:#666; font-family:Segoe UI, sans-serif; }
  </style>
</head>
<body>
  <div class="center">WebView2 initialized (video wiring in progress)</div>
</body>
</html>
""";
    }

    private static string GetVideoHtml()
    {
        return """
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    html, body { margin:0; padding:0; height:100%; background:#000; overflow:hidden; }
    #v { width:100%; height:100%; object-fit:contain; background:#000; }
  </style>
</head>
<body>
  <video id="v" controls></video>
  <script>
    function post(msg) {
      try { window.chrome && window.chrome.webview && window.chrome.webview.postMessage(msg); } catch (e) {}
    }
    const v = document.getElementById('v');
    v.addEventListener('timeupdate', () => post('time:' + v.currentTime));
    v.addEventListener('loadedmetadata', () => post('duration:' + v.duration));
    v.addEventListener('error', () => post('error:' + (v.error ? v.error.message : 'video error')));

    window.audixa = {
      setSource: (url) => { v.src = url; v.load(); },
      play: () => { v.play(); },
      pause: () => { v.pause(); },
      seek: (seconds) => { v.currentTime = seconds; },
      speed: (s) => { v.playbackRate = s; },
    };
  </script>
</body>
</html>
""";
    }

    private void RunScript(string script)
    {
        if (_controller?.CoreWebView2 is null)
        {
            _pendingScripts.Enqueue(script);
            return;
        }

        _ = _controller.CoreWebView2.ExecuteScriptAsync(script);
    }

    private void RunWhenReady(Action action)
    {
        if (_controller?.CoreWebView2 is null)
        {
            Dispatcher.UIThread.Post(() =>
            {
                if (_controller?.CoreWebView2 is not null)
                    action();
            });
            return;
        }

        action();
    }

    private static IntPtr CreateHostWindow(IntPtr parentHwnd)
    {
        const int WS_CHILD = 0x40000000;
        const int WS_VISIBLE = 0x10000000;

        var hwnd = CreateWindowExW(
            0,
            "STATIC",
            "",
            WS_CHILD | WS_VISIBLE,
            0,
            0,
            1,
            1,
            parentHwnd,
            IntPtr.Zero,
            IntPtr.Zero,
            IntPtr.Zero);

        return hwnd;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateWindowExW(
        int dwExStyle,
        string lpClassName,
        string lpWindowName,
        int dwStyle,
        int x,
        int y,
        int nWidth,
        int nHeight,
        IntPtr hWndParent,
        IntPtr hMenu,
        IntPtr hInstance,
        IntPtr lpParam);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyWindow(IntPtr hWnd);
}


