using Android.App;
using Android.Content.PM;
using Avalonia;
using Avalonia.Android;
using Android.OS;
using Android.Views;
using AgiBuild.Audixa.Android.Platform;

namespace AgiBuild.Audixa.Android;

[Activity(
    Label = "AgiBuild.Audixa.Android",
    Theme = "@style/MyTheme.NoActionBar",
    Icon = "@drawable/icon",
    MainLauncher = true,
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize | ConfigChanges.UiMode)]
public class MainActivity : AvaloniaMainActivity<App>
{
    protected override void OnCreate(Bundle? savedInstanceState)
    {
        base.OnCreate(savedInstanceState);

        // Insert a native video layer behind Avalonia content.
        // This avoids requiring native view embedding inside Avalonia layout on Android.
        var content = FindViewById<ViewGroup>(global::Android.Resource.Id.Content);
        if (content is not null)
        {
            var textureView = new TextureView(this)
            {
                LayoutParameters = new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MatchParent, ViewGroup.LayoutParams.MatchParent)
            };

            content.AddView(textureView, 0);
            AndroidVideoHost.Initialize(this, textureView);
        }
    }

    protected override void OnActivityResult(int requestCode, global::Android.App.Result resultCode, global::Android.Content.Intent? data)
    {
        base.OnActivityResult(requestCode, resultCode, data);
        AndroidPickerHost.OnActivityResult(requestCode, resultCode, data);
    }

    protected override AppBuilder CustomizeAppBuilder(AppBuilder builder)
    {
        return base.CustomizeAppBuilder(builder)
            .WithInterFont();
    }
}
