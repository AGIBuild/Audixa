using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Platform;
using AgiBuild.Audixa.Presentation.Video;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Services.Impl;
using AgiBuild.Audixa.Stores;
using AgiBuild.Audixa.Tests.TestSupport;
using AgiBuild.Audixa.ViewModels;
using Avalonia.Controls;
using Xunit;

namespace AgiBuild.Audixa.Tests.ViewModelTests;

public sealed class PlayerViewModelTests
{
    [Fact]
    public async Task LoadPrimarySubtitle_BuildsRows_AndPositionUpdatesActiveIndex()
    {
        var srt = """
1
00:00:01,000 --> 00:00:02,000
Hello
""";

        var file = CreateTempFile(".srt", srt);
        try
        {
            var playback = new FakePlaybackService();
            playback.State.CurrentItem = new MediaItem("m1", "a.mp4", MediaSourceKind.Local, "file:///a.mp4", null);

            var vm = new PlayerViewModel(
                playback: playback,
                videoSurfaceFactory: new FakeVideoSurfaceFactory(),
                subtitles: new SubtitleService(),
                subtitlePicker: new FakeSubtitlePicker(new Uri(file)),
                learningStore: new FakeLearningStore(),
                notifications: new FakeNotifications(),
                timeProvider: new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero)));

            await vm.LoadPrimarySubtitleCommand.ExecuteAsync(null);

            Assert.Single(vm.SubtitleRows);
            Assert.Equal("Hello", vm.SubtitleRows[0].PrimaryText);

            playback.State.Position = TimeSpan.FromMilliseconds(1500);
            Assert.Equal(0, vm.ActiveIndex);
            Assert.Equal("Hello", vm.DisplayedPrimaryText);
        }
        finally
        {
            TryDelete(file);
        }
    }

    [Fact]
    public async Task SaveCurrentSentence_WritesToLearningStore_AndShowsToast()
    {
        var srt = """
1
00:00:01,000 --> 00:00:02,000
Hello
""";

        var file = CreateTempFile(".srt", srt);
        try
        {
            var playback = new FakePlaybackService();
            playback.State.CurrentItem = new MediaItem("m1", "a.mp4", MediaSourceKind.Local, "file:///a.mp4", null);

            var learning = new FakeLearningStore();
            var notifications = new FakeNotifications();
            var time = new ManualTimeProvider(new DateTimeOffset(2025, 12, 26, 0, 0, 0, TimeSpan.Zero));

            var vm = new PlayerViewModel(
                playback: playback,
                videoSurfaceFactory: new FakeVideoSurfaceFactory(),
                subtitles: new SubtitleService(),
                subtitlePicker: new FakeSubtitlePicker(new Uri(file)),
                learningStore: learning,
                notifications: notifications,
                timeProvider: time);

            await vm.LoadPrimarySubtitleCommand.ExecuteAsync(null);
            playback.State.Position = TimeSpan.FromMilliseconds(1500);

            await vm.SaveCurrentSentenceCommand.ExecuteAsync(null);

            Assert.Equal(1, learning.AddSavedSentenceCalls);
            Assert.Equal("m1", learning.LastSaved?.MediaItemId);
            Assert.Equal("Hello", learning.LastSaved?.PrimaryText);
            Assert.Equal("Saved", notifications.LastToast?.Title);
        }
        finally
        {
            TryDelete(file);
        }
    }

    private static string CreateTempFile(string ext, string content)
    {
        var dir = Path.Combine(Path.GetTempPath(), "AudixaTests");
        Directory.CreateDirectory(dir);
        var path = Path.Combine(dir, Guid.NewGuid().ToString("N") + ext);
        File.WriteAllText(path, content, Encoding.UTF8);
        return path;
    }

    private static void TryDelete(string path)
    {
        try { File.Delete(path); } catch { /* ignore */ }
    }

    private sealed class FakeVideoSurfaceFactory : IVideoSurfaceFactory
    {
        public Control Create() => new Border();
    }

    private sealed class FakeSubtitlePicker : ILocalSubtitlePicker
    {
        private readonly Uri _uri;
        public FakeSubtitlePicker(Uri uri) => _uri = uri;
        public Task<Uri?> PickSubtitleAsync() => Task.FromResult<Uri?>(_uri);
    }

    private sealed class FakePlaybackService : IPlaybackService
    {
        public PlaybackState State { get; } = new();
        public event EventHandler<MediaItem>? MediaOpened;

        public int PlayCalls { get; private set; }
        public int SeekCalls { get; private set; }

        public void Play() => PlayCalls++;
        public void Pause() { }
        public void Seek(TimeSpan position) { SeekCalls++; State.Position = position; }
        public void SetSpeed(double speed) { }
        public void Open(MediaItem item, PlaybackInput input) => MediaOpened?.Invoke(this, item);
    }

    private sealed class FakeLearningStore : ILearningStore
    {
        public int AddSavedSentenceCalls { get; private set; }
        public SavedSentence? LastSaved { get; private set; }

        public Task AddSavedSentenceAsync(SavedSentence sentence)
        {
            AddSavedSentenceCalls++;
            LastSaved = sentence;
            return Task.CompletedTask;
        }

        public Task AddVocabularyAsync(VocabularyItem item) => Task.CompletedTask;
        public Task<int> GetSavedSentenceCountAsync() => Task.FromResult(0);
        public Task<int> GetVocabularyCountAsync() => Task.FromResult(0);
        public Task<System.Collections.Generic.IReadOnlyList<SavedSentence>> GetSavedSentencesAsync(int limit) =>
            Task.FromResult<System.Collections.Generic.IReadOnlyList<SavedSentence>>(Array.Empty<SavedSentence>());
        public Task<System.Collections.Generic.IReadOnlyList<VocabularyItem>> GetVocabularyAsync(int limit) =>
            Task.FromResult<System.Collections.Generic.IReadOnlyList<VocabularyItem>>(Array.Empty<VocabularyItem>());
    }

    private sealed class FakeNotifications : INotificationService
    {
        public event EventHandler<ToastNotification>? ToastRaised;
        public event EventHandler<string>? TopAlertRaised;

        public ToastNotification? LastToast { get; private set; }

        public void ShowToast(string title, string message)
        {
            LastToast = new ToastNotification(title, message);
            ToastRaised?.Invoke(this, LastToast);
        }

        public void ShowTopAlert(string message) => TopAlertRaised?.Invoke(this, message);
    }
}


