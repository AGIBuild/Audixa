using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.ViewModels;
using Xunit;

namespace AgiBuild.Audixa.Tests.ViewModelTests;

public sealed class MiniPlayerViewModelTests
{
    [Fact]
    public void TogglePlayPause_WhenPaused_CallsPlay()
    {
        var playback = new FakePlayback();
        playback.State.IsPlaying = false;

        var vm = new MiniPlayerViewModel(playback);

        vm.TogglePlayPauseCommand.Execute(null);

        Assert.Equal(1, playback.PlayCalls);
        Assert.Equal(0, playback.PauseCalls);
    }

    [Fact]
    public void TogglePlayPause_WhenPlaying_CallsPause()
    {
        var playback = new FakePlayback();
        playback.State.IsPlaying = true;

        var vm = new MiniPlayerViewModel(playback);

        vm.TogglePlayPauseCommand.Execute(null);

        Assert.Equal(0, playback.PlayCalls);
        Assert.Equal(1, playback.PauseCalls);
    }

    private sealed class FakePlayback : IPlaybackService
    {
        public PlaybackState State { get; } = new();
        public event System.EventHandler<Domain.MediaItem>? MediaOpened;
        public int PlayCalls { get; private set; }
        public int PauseCalls { get; private set; }

        public void Play() => PlayCalls++;
        public void Pause() => PauseCalls++;
        public void Seek(System.TimeSpan position) { }
        public void SetSpeed(double speed) { }
        public void Open(Domain.MediaItem item, PlaybackInput input) => MediaOpened?.Invoke(this, item);
    }
}


