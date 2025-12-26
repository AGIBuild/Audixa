using System;
using System.IO;
using System.Threading.Tasks;
using Foundation;
using UIKit;

namespace AgiBuild.Audixa.iOS.Platform;

internal static class IosDocumentPickerHost
{
    public static Task<Uri?> PickSingleAsync(string[] allowedUtis, string? fallbackExtension)
    {
        var tcs = new TaskCompletionSource<Uri?>(TaskCreationOptions.RunContinuationsAsynchronously);

        UIApplication.SharedApplication.InvokeOnMainThread(() =>
        {
            try
            {
                var controller = GetPresenterController();
                if (controller is null)
                {
                    tcs.TrySetResult(null);
                    return;
                }

                var picker = new UIDocumentPickerViewController(allowedUtis, UIDocumentPickerMode.Open)
                {
                    AllowsMultipleSelection = false,
                };

                picker.Delegate = new Delegate(tcs, fallbackExtension);
                controller.PresentViewController(picker, true, null);
            }
            catch
            {
                tcs.TrySetResult(null);
            }
        });

        return tcs.Task;
    }

    private static UIViewController? GetPresenterController()
    {
        UIWindow? window = null;
        foreach (var scene in UIApplication.SharedApplication.ConnectedScenes)
        {
            if (scene is not UIWindowScene ws)
                continue;

            foreach (var w in ws.Windows)
            {
                if (w.IsKeyWindow)
                {
                    window = w;
                    break;
                }
            }

            if (window is null && ws.Windows.Length > 0)
                window = ws.Windows[0];

            if (window is not null)
                break;
        }

        var vc = window?.RootViewController;
        while (vc?.PresentedViewController is not null)
            vc = vc.PresentedViewController;
        return vc;
    }

    private sealed class Delegate : UIDocumentPickerDelegate
    {
        private readonly TaskCompletionSource<Uri?> _tcs;
        private readonly string? _fallbackExt;

        public Delegate(TaskCompletionSource<Uri?> tcs, string? fallbackExt)
        {
            _tcs = tcs;
            _fallbackExt = fallbackExt;
        }

        public override void WasCancelled(UIDocumentPickerViewController controller)
        {
            _tcs.TrySetResult(null);
        }

        public override void DidPickDocument(UIDocumentPickerViewController controller, NSUrl url)
        {
            _tcs.TrySetResult(CopyToSandbox(url, _fallbackExt));
        }

        public override void DidPickDocument(UIDocumentPickerViewController controller, NSUrl[] urls)
        {
            var url = urls is { Length: > 0 } ? urls[0] : null;
            _tcs.TrySetResult(url is null ? null : CopyToSandbox(url, _fallbackExt));
        }

        private static Uri? CopyToSandbox(NSUrl url, string? fallbackExt)
        {
            bool scoped = false;
            try
            {
                scoped = url.StartAccessingSecurityScopedResource();

                var srcPath = url.Path;
                if (string.IsNullOrWhiteSpace(srcPath) || !File.Exists(srcPath))
                    return null;

                var root = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                var dir = Path.Combine(root, "Audixa", "imports");
                Directory.CreateDirectory(dir);

                var name = url.LastPathComponent;
                if (string.IsNullOrWhiteSpace(name))
                {
                    var ext = fallbackExt is null ? string.Empty : "." + fallbackExt.TrimStart('.');
                    name = Guid.NewGuid().ToString("N") + ext;
                }

                var destPath = Path.Combine(dir, name);
                if (File.Exists(destPath))
                {
                    var ext = Path.GetExtension(destPath);
                    var baseName = Path.GetFileNameWithoutExtension(destPath);
                    destPath = Path.Combine(dir, $"{baseName}-{Guid.NewGuid():N}{ext}");
                }

                File.Copy(srcPath, destPath, overwrite: false);
                return new UriBuilder("file", string.Empty) { Path = destPath }.Uri;
            }
            catch
            {
                return null;
            }
            finally
            {
                try
                {
                    if (scoped)
                        url.StopAccessingSecurityScopedResource();
                }
                catch
                {
                    // ignore
                }
            }
        }
    }
}


