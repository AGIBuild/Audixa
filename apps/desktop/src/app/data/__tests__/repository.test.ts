import { describe, expect, it } from 'vitest';
import { createRepository } from '../repository';
import type {
  DesktopDataStore,
  LibraryCredentialRecord,
  LibraryItemRecord,
  LibraryRecord,
  LibrarySourceRecord,
  ListeningItemRecord,
  MediaSourceRecord,
  RecentPlaybackRecord,
  SubtitleTrackRecord,
  VocabItemRecord,
} from '../store';
import type { SubtitleItem } from '../types';

function createMemoryStore(): DesktopDataStore {
  const mediaSources: MediaSourceRecord[] = [];
  const recentPlaybacks: RecentPlaybackRecord[] = [];
  const subtitleTracks: SubtitleTrackRecord[] = [];
  const listeningItems: ListeningItemRecord[] = [];
  const vocabItems: VocabItemRecord[] = [];
  const libraries: LibraryRecord[] = [];
  const librarySources: LibrarySourceRecord[] = [];
  const libraryItems: LibraryItemRecord[] = [];
  const libraryCredentials: LibraryCredentialRecord[] = [];
  const appState: { key: string; value: string; updatedAt: string }[] = [];

  return {
    async listMediaSources() {
      return [...mediaSources].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async findMediaSourceByUri(uri) {
      return mediaSources.find((item) => item.uri === uri) ?? null;
    },
    async insertMediaSource(record) {
      mediaSources.push(record);
    },
    async updateMediaSource(record) {
      const index = mediaSources.findIndex((item) => item.id === record.id);
      if (index === -1) {
        return;
      }
      mediaSources[index] = record;
    },
    async listRecentPlaybacks() {
      return [...recentPlaybacks].sort((a, b) => (a.lastPlayedAt < b.lastPlayedAt ? 1 : -1));
    },
    async upsertRecentPlayback(record) {
      const index = recentPlaybacks.findIndex(
        (item) => item.mediaSourceId === record.mediaSourceId,
      );
      if (index === -1) {
        recentPlaybacks.push(record);
        return;
      }
      recentPlaybacks[index] = {
        ...recentPlaybacks[index],
        progress: record.progress,
        lastPlayedAt: record.lastPlayedAt,
      };
    },
    async listSubtitleTracks(mediaSourceId) {
      return subtitleTracks.filter((item) => item.mediaSourceId === mediaSourceId);
    },
    async insertSubtitleTrack(record) {
      subtitleTracks.push(record);
    },
    async listListeningItems() {
      return [...listeningItems].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    async insertListeningItem(record) {
      listeningItems.push(record);
    },
    async updateListeningItemTitle(id, title) {
      const index = listeningItems.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }
      listeningItems[index] = {
        ...listeningItems[index],
        titleOverride: title,
      };
    },
    async updateListeningItemFavorite(id, isFavorite) {
      const index = listeningItems.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }
      listeningItems[index] = {
        ...listeningItems[index],
        isFavorite,
      };
    },
    async deleteListeningItem(id) {
      const index = listeningItems.findIndex((item) => item.id === id);
      if (index === -1) {
        return;
      }
      listeningItems.splice(index, 1);
    },
    async listVocabItems() {
      return [...vocabItems].sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : -1));
    },
    async upsertVocabItem(record) {
      const index = vocabItems.findIndex(
        (item) =>
          item.canonicalWord === record.canonicalWord && item.locale === record.locale,
      );
      if (index === -1) {
        vocabItems.push(record);
        return;
      }
      vocabItems[index] = {
        ...vocabItems[index],
        word: record.word,
        definition: record.definition,
        example: record.example,
        source: record.source,
        pronunciation: record.pronunciation,
        isFavorite: record.isFavorite,
        isMastered: record.isMastered,
        lastSeenAt: record.lastSeenAt,
      };
    },
    async updateVocabItem(record) {
      const index = vocabItems.findIndex((item) => item.id === record.id);
      if (index === -1) {
        return;
      }
      vocabItems[index] = record;
    },
    async deleteVocabItem(id) {
      const index = vocabItems.findIndex((item) => item.id === id);
      if (index !== -1) {
        vocabItems.splice(index, 1);
      }
    },
    async listLibraries() {
      return [...libraries].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async insertLibrary(record) {
      libraries.push(record);
    },
    async updateLibraryTimestamp(libraryId, updatedAt) {
      const index = libraries.findIndex((item) => item.id === libraryId);
      if (index === -1) {
        return;
      }
      libraries[index] = { ...libraries[index], updatedAt };
    },
    async listLibrarySources(libraryId) {
      return librarySources.filter((item) => item.libraryId === libraryId);
    },
    async insertLibrarySource(record) {
      librarySources.push(record);
    },
    async listLibraryItems(libraryId) {
      return libraryItems.filter((item) => item.libraryId === libraryId);
    },
    async upsertLibraryItem(record) {
      const index = libraryItems.findIndex(
        (item) => item.libraryId === record.libraryId && item.uri === record.uri,
      );
      if (index === -1) {
        libraryItems.push(record);
        return;
      }
      libraryItems[index] = { ...libraryItems[index], ...record };
    },
    async updateLibraryItem(record) {
      const index = libraryItems.findIndex((item) => item.id === record.id);
      if (index === -1) {
        return;
      }
      libraryItems[index] = { ...libraryItems[index], ...record };
    },
    async deleteLibraryItemByUri(libraryId, uri) {
      const index = libraryItems.findIndex(
        (item) => item.libraryId === libraryId && item.uri === uri,
      );
      if (index !== -1) {
        libraryItems.splice(index, 1);
      }
    },
    async deleteLibraryItem(id) {
      const index = libraryItems.findIndex((item) => item.id === id);
      if (index !== -1) {
        libraryItems.splice(index, 1);
      }
    },
    async listLibraryCredentials(libraryId) {
      return libraryCredentials.filter((item) => item.libraryId === libraryId);
    },
    async upsertLibraryCredential(record) {
      const index = libraryCredentials.findIndex((item) => item.libraryId === record.libraryId);
      if (index === -1) {
        libraryCredentials.push(record);
        return;
      }
      libraryCredentials[index] = record;
    },
    async deleteLibraryItemsByLibraryId(libraryId) {
      for (let i = libraryItems.length - 1; i >= 0; i -= 1) {
        if (libraryItems[i]?.libraryId === libraryId) {
          libraryItems.splice(i, 1);
        }
      }
    },
    async deleteLibrarySourcesByLibraryId(libraryId) {
      for (let i = librarySources.length - 1; i >= 0; i -= 1) {
        if (librarySources[i]?.libraryId === libraryId) {
          librarySources.splice(i, 1);
        }
      }
    },
    async deleteLibraryCredentialsByLibraryId(libraryId) {
      for (let i = libraryCredentials.length - 1; i >= 0; i -= 1) {
        if (libraryCredentials[i]?.libraryId === libraryId) {
          libraryCredentials.splice(i, 1);
        }
      }
    },
    async deleteLibrary(libraryId) {
      const index = libraries.findIndex((item) => item.id === libraryId);
      if (index !== -1) {
        libraries.splice(index, 1);
      }
    },
    async getAppState(key) {
      return appState.find((item) => item.key === key) ?? null;
    },
    async upsertAppState(record) {
      const index = appState.findIndex((item) => item.key === record.key);
      if (index === -1) {
        appState.push(record);
        return;
      }
      appState[index] = record;
    },
  };
}

const subtitleSample: SubtitleItem = {
  id: 's-1',
  time: '00:10',
  en: 'Hello world from Audixa.',
  cn: 'Hello world.',
  startMs: 10000,
  endMs: 15000,
};

describe('desktop repository', () => {
  it('imports media sources and lists them', async () => {
    const repo = createRepository(createMemoryStore());
    const source = await repo.addMediaSourceFromPath('C:\\media\\Lesson One.mp3');
    const sources = await repo.listSources();

    expect(sources).toHaveLength(1);
    expect(source.title).toBe('Lesson One');
    expect(sources[0].subtitle).toBe('C:/media');
  });

  it('records recent playback for a media source', async () => {
    const repo = createRepository(createMemoryStore());
    const source = await repo.addMediaSourceFromPath('C:\\media\\Episode.mkv');
    await repo.recordRecentPlayback(source.id, 42);

    const recents = await repo.listRecents();
    expect(recents).toHaveLength(1);
    expect(recents[0].title).toBe('Episode');
    expect(recents[0].progress).toBe(42);
  });

  it('saves listening items with sentence metadata', async () => {
    const repo = createRepository(createMemoryStore());
    const source = await repo.addMediaSourceFromPath('C:\\media\\Episode.mkv');
    const item = await repo.saveListeningItem(source.id, subtitleSample);

    expect(item).not.toBeNull();
    expect(item?.title).toBe(subtitleSample.en);
    expect(item?.duration).toBe('00:05');
  });

  it('deduplicates vocabulary entries by canonical word', async () => {
    const repo = createRepository(createMemoryStore());
    const source = await repo.addMediaSourceFromPath('C:\\media\\Episode.mkv');
    await repo.upsertVocabFromSubtitle(source.id, subtitleSample);
    await repo.upsertVocabFromSubtitle(source.id, {
      ...subtitleSample,
      en: 'HELLO again.',
    });

    const vocabItems = await repo.listVocabItems();
    expect(vocabItems).toHaveLength(1);
    expect(vocabItems[0]?.canonicalWord).toBe('hello');
  });

  it('creates a default library for existing sources', async () => {
    const repo = createRepository(createMemoryStore());
    const source = await repo.addMediaSourceFromPath('C:\\media\\Lesson One.mp3');

    const libraries = await repo.listLibraries();
    expect(libraries).toHaveLength(1);

    const items = await repo.listLibraryItems(libraries[0].id);
    expect(items.some((item) => item.uri === source.uri)).toBe(true);
  });

  it('adds manual library items and maps to media sources', async () => {
    const repo = createRepository(createMemoryStore());
    const library = await repo.createLibrary({
      name: 'Manual',
      type: 'local-manual',
    });

    const item = await repo.addManualLibraryItem(library.id, 'C:\\media\\Clip.mp3');
    const items = await repo.listLibraryItems(library.id);

    expect(items).toHaveLength(1);
    expect(item.title).toBe('Clip');
  });

  it('deletes a library and removes its items', async () => {
    const repo = createRepository(createMemoryStore());
    const library = await repo.createLibrary({
      name: 'Manual',
      type: 'local-manual',
    });
    await repo.addManualLibraryItem(library.id, 'C:\\media\\Clip.mp3');

    await repo.deleteLibrary(library.id);

    const libraries = await repo.listLibraries();
    expect(libraries).toHaveLength(0);
  });
});
