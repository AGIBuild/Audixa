using Android.App;
using Android.Views;
using Android.Graphics;

namespace AgiBuild.Audixa.Android.Platform;

public static class AndroidVideoHost
{
    private static Activity? _activity;
    private static TextureView? _textureView;

    public static void Initialize(Activity activity, TextureView textureView)
    {
        _activity = activity;
        _textureView = textureView;
    }

    public static Activity? Activity => _activity;

    public static TextureView? TextureView => _textureView;

    public static bool TryGetSurface(out Surface? surface)
    {
        surface = null;
        if (_textureView is null)
            return false;
        if (!_textureView.IsAvailable)
            return false;
        if (_textureView.SurfaceTexture is null)
            return false;

        surface = new Surface(_textureView.SurfaceTexture);
        return true;
    }
}


