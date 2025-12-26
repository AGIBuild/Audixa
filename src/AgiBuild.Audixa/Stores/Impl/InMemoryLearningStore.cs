using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Stores.Impl;

public sealed class InMemoryLearningStore : ILearningStore
{
    private readonly List<SavedSentence> _sentences = new();
    private readonly List<VocabularyItem> _vocab = new();

    public Task AddSavedSentenceAsync(SavedSentence sentence)
    {
        _sentences.Add(sentence);
        return Task.CompletedTask;
    }

    public Task AddVocabularyAsync(VocabularyItem item)
    {
        _vocab.Add(item);
        return Task.CompletedTask;
    }

    public Task<int> GetSavedSentenceCountAsync() => Task.FromResult(_sentences.Count(x => !x.Deleted));
    public Task<int> GetVocabularyCountAsync() => Task.FromResult(_vocab.Count(x => !x.Deleted));

    public Task<IReadOnlyList<SavedSentence>> GetSavedSentencesAsync(int limit) =>
        Task.FromResult((IReadOnlyList<SavedSentence>)_sentences.Where(x => !x.Deleted).Take(limit).ToList());

    public Task<IReadOnlyList<VocabularyItem>> GetVocabularyAsync(int limit) =>
        Task.FromResult((IReadOnlyList<VocabularyItem>)_vocab.Where(x => !x.Deleted).Take(limit).ToList());
}


