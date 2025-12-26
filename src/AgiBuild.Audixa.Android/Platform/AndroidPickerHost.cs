using System.Threading.Tasks;
using Android.App;
using Android.Content;

namespace AgiBuild.Audixa.Android.Platform;

public static class AndroidPickerHost
{
    private const int RequestPickVideo = 41001;
    private const int RequestPickSubtitle = 41002;

    private static TaskCompletionSource<global::Android.Net.Uri?>? _videoTcs;
    private static TaskCompletionSource<global::Android.Net.Uri?>? _subtitleTcs;

    public static Task<global::Android.Net.Uri?> PickVideoAsync()
    {
        var activity = AndroidVideoHost.Activity;
        if (activity is null)
            return Task.FromResult<global::Android.Net.Uri?>(null);

        if (_videoTcs is not null)
            return _videoTcs.Task;

        _videoTcs = new TaskCompletionSource<global::Android.Net.Uri?>(TaskCreationOptions.RunContinuationsAsynchronously);

        var intent = new Intent(Intent.ActionOpenDocument);
        intent.AddCategory(Intent.CategoryOpenable);
        intent.SetType("video/mp4");

        activity.StartActivityForResult(intent, RequestPickVideo);
        return _videoTcs.Task;
    }

    public static Task<global::Android.Net.Uri?> PickSubtitleAsync()
    {
        var activity = AndroidVideoHost.Activity;
        if (activity is null)
            return Task.FromResult<global::Android.Net.Uri?>(null);

        if (_subtitleTcs is not null)
            return _subtitleTcs.Task;

        _subtitleTcs = new TaskCompletionSource<global::Android.Net.Uri?>(TaskCreationOptions.RunContinuationsAsynchronously);

        var intent = new Intent(Intent.ActionOpenDocument);
        intent.AddCategory(Intent.CategoryOpenable);
        intent.SetType("*/*");
        intent.PutExtra(Intent.ExtraMimeTypes, new[] { "text/vtt", "application/x-subrip", "text/plain" });

        activity.StartActivityForResult(intent, RequestPickSubtitle);
        return _subtitleTcs.Task;
    }

    public static void OnActivityResult(int requestCode, Result resultCode, Intent? data)
    {
        if (requestCode == RequestPickVideo)
        {
            var tcs = _videoTcs;
            _videoTcs = null;
            tcs?.TrySetResult(resultCode == Result.Ok ? data?.Data : null);
        }
        else if (requestCode == RequestPickSubtitle)
        {
            var tcs = _subtitleTcs;
            _subtitleTcs = null;
            tcs?.TrySetResult(resultCode == Result.Ok ? data?.Data : null);
        }
    }
}


