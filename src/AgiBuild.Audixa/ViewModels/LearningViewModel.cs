using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;
using AgiBuild.Audixa.Services;
using AgiBuild.Audixa.Stores;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace AgiBuild.Audixa.ViewModels;

public partial class LearningViewModel : ViewModelBase
{
    private readonly ILearningStore _learningStore;
    private readonly INotificationService _notifications;
    private readonly TimeProvider _timeProvider;

    public LearningViewModel(ILearningStore learningStore, INotificationService notifications, TimeProvider timeProvider)
    {
        _learningStore = learningStore;
        _notifications = notifications;
        _timeProvider = timeProvider;
        Initialization = RefreshAsync();
    }

    public Task Initialization { get; }

    [ObservableProperty]
    private string _title = "Learning";

    [ObservableProperty]
    private int _savedSentenceCount;

    [ObservableProperty]
    private int _vocabularyCount;

    [ObservableProperty]
    private string _newWord = string.Empty;

    public ObservableCollection<SavedSentence> RecentSavedSentences { get; } = new();
    public ObservableCollection<SavedSentence> SavedSentences { get; } = new();
    public ObservableCollection<VocabularyItem> VocabularyItems { get; } = new();

    [RelayCommand]
    private async Task RefreshAsync()
    {
        SavedSentenceCount = await _learningStore.GetSavedSentenceCountAsync();
        VocabularyCount = await _learningStore.GetVocabularyCountAsync();

        RecentSavedSentences.Clear();
        foreach (var s in await _learningStore.GetSavedSentencesAsync(1))
        {
            RecentSavedSentences.Add(s);
        }

        SavedSentences.Clear();
        foreach (var s in await _learningStore.GetSavedSentencesAsync(20))
        {
            SavedSentences.Add(s);
        }

        VocabularyItems.Clear();
        foreach (var v in await _learningStore.GetVocabularyAsync(50))
        {
            VocabularyItems.Add(v);
        }
    }

    [RelayCommand]
    private async Task AddWordAsync()
    {
        var word = NewWord?.Trim();
        if (string.IsNullOrWhiteSpace(word))
            return;

        var item = new VocabularyItem(
            Id: Guid.NewGuid().ToString("N"),
            Word: word,
            Context: null,
            SourceMediaItemId: null,
            UpdatedAtUtc: _timeProvider.GetUtcNow(),
            Deleted: false);

        await _learningStore.AddVocabularyAsync(item);
        NewWord = string.Empty;
        _notifications.ShowToast("Added", "Word added to vocabulary.");
        await RefreshAsync();
    }
}


