using System.Collections.Generic;
using System.Threading.Tasks;
using AgiBuild.Audixa.Domain;

namespace AgiBuild.Audixa.Stores;

public interface ILearningStore
{
    Task AddSavedSentenceAsync(SavedSentence sentence);
    Task AddVocabularyAsync(VocabularyItem item);

    Task<int> GetSavedSentenceCountAsync();
    Task<int> GetVocabularyCountAsync();

    Task<IReadOnlyList<SavedSentence>> GetSavedSentencesAsync(int limit);
    Task<IReadOnlyList<VocabularyItem>> GetVocabularyAsync(int limit);
}


