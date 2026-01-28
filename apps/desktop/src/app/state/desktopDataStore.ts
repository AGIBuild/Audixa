import { create } from 'zustand';
import type {
  Library,
  LibraryItem,
  LibraryType,
  ListeningItem,
  RecentItem,
  SourceItem,
  SubtitleItem,
  VocabItem,
} from '../data/types';
import { pickMediaFiles, pickSubtitleFile } from '../data/dialogs';
import { getDesktopRepository } from '../data/repository';
import { subtitleSeed } from '../data/subtitleSeed';

type LibraryCreateInput = {
  name: string;
  type: LibraryType;
  pathOrUrl?: string;
  metadata?: Record<string, unknown>;
};

type DesktopDataState = {
  sources: SourceItem[];
  recentItems: RecentItem[];
  listeningItems: ListeningItem[];
  vocabItems: VocabItem[];
  subtitleItems: SubtitleItem[];
  libraries: Library[];
  libraryItems: LibraryItem[];
  activeLibraryId: string | null;
  activeSourceId: string | null;
  loadSeq: number;
  isLoading: boolean;
  libraryLoading: boolean;
  error: string | null;
  loadAll: () => Promise<void>;
  selectLibrary: (libraryId: string) => Promise<void>;
  refreshActiveLibrary: () => Promise<void>;
  createLibrary: (input: LibraryCreateInput) => Promise<void>;
  createWebDavLibrary: (input: {
    name: string;
    baseUrl: string;
    username: string;
    password: string;
  }) => Promise<void>;
  createCloudDriveLibrary: (name: string) => Promise<void>;
  addManualItemToActive: () => Promise<void>;
  deleteActiveLibrary: () => Promise<void>;
  selectLibraryItem: (itemId: string) => void;
  attachSubtitleToActive: () => Promise<void>;
  saveListeningItem: (subtitle: SubtitleItem) => Promise<void>;
  updateListeningItemTitle: (id: string, title: string) => Promise<void>;
  toggleListeningItemFavorite: (id: string) => Promise<void>;
  deleteListeningItem: (id: string) => Promise<void>;
  renameLibraryItem: (itemId: string, nextName: string) => Promise<void>;
  deleteLibraryItem: (itemId: string) => Promise<void>;
  addVocabFromSubtitle: (subtitle: SubtitleItem) => Promise<void>;
  addVocabFromLookup: (input: {
    word: string;
    definition?: string;
    pronunciation?: string | null;
    example?: string;
  }) => Promise<void>;
  toggleVocabFavorite: (id: string) => Promise<void>;
  toggleVocabMastered: (id: string) => Promise<void>;
  deleteVocabItem: (id: string) => Promise<void>;
  clearActiveSource: () => void;
  recordRecentPlayback: (progress: number) => Promise<void>;
};

type MediaSourceSnapshot = {
  id: string;
  title: string;
  uri: string;
  kind: SourceItem['kind'];
};

function getActiveMediaSourceSnapshot(
  state: Pick<DesktopDataState, 'activeSourceId' | 'libraryItems' | 'sources'>,
): MediaSourceSnapshot | null {
  if (!state.activeSourceId) {
    return null;
  }
  const libraryItem = state.libraryItems.find((item) => item.id === state.activeSourceId);
  if (libraryItem) {
    return {
      id: libraryItem.id,
      title: libraryItem.title,
      uri: libraryItem.uri,
      kind: libraryItem.kind,
    };
  }
  const source = state.sources.find((item) => item.id === state.activeSourceId);
  if (source) {
    return {
      id: source.id,
      title: source.title,
      uri: source.uri,
      kind: source.kind,
    };
  }
  return null;
}

export const useDesktopDataStore = create<DesktopDataState>((set, get) => ({
  sources: [],
  recentItems: [],
  listeningItems: [],
  vocabItems: [],
  subtitleItems: subtitleSeed,
  libraries: [],
  libraryItems: [],
  activeLibraryId: null,
  activeSourceId: null,
  loadSeq: 0,
  isLoading: false,
  libraryLoading: false,
  error: null,
  loadAll: async () => {
    const nextSeq = get().loadSeq + 1;
    set({ isLoading: true, error: null, loadSeq: nextSeq });
    try {
      const repo = await getDesktopRepository();
      const [sources, recentItems, listeningItems, vocabItems, libraries] = await Promise.all([
        repo.listSources(),
        repo.listRecents(),
        repo.listListeningItems(),
        repo.listVocabItems(),
        repo.listLibraries(),
      ]);
      if (get().loadSeq !== nextSeq) {
        return;
      }
      const activeLibraryId = get().activeLibraryId ?? libraries[0]?.id ?? null;
      set({
        sources,
        recentItems,
        listeningItems,
        vocabItems,
        libraries,
        activeLibraryId,
        isLoading: false,
      });
      if (activeLibraryId) {
        await get().selectLibrary(activeLibraryId);
      }
    } catch (error) {
      if (get().loadSeq !== nextSeq) {
        return;
      }
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load data.'),
      });
    }
  },
  selectLibrary: async (libraryId) => {
    set({ activeLibraryId: libraryId, libraryLoading: true });
    try {
      const repo = await getDesktopRepository();
      const libraries = get().libraries.length ? get().libraries : await repo.listLibraries();
      const library = libraries.find((item) => item.id === libraryId);
      let items: LibraryItem[] = [];
      if (library?.type === 'cloud-drive') {
        items = [];
      } else {
        items = await repo.listLibraryItems(libraryId);
      }
      set({
        libraries,
        libraryItems: items,
        libraryLoading: false,
      });
    } catch (error) {
      set({
        libraryLoading: false,
        error: getErrorMessage(error, 'Failed to load library items.'),
      });
    }
  },
  refreshActiveLibrary: async () => {
    const { activeLibraryId } = get();
    if (!activeLibraryId) {
      return;
    }
    set({ libraryLoading: true });
    try {
      const repo = await getDesktopRepository();
      let libraries = get().libraries;
      let library = libraries.find((item) => item.id === activeLibraryId);
      if (!library) {
        libraries = await repo.listLibraries();
        library = libraries.find((item) => item.id === activeLibraryId);
        if (!library) {
          set({
            libraries,
            libraryLoading: false,
            error: 'Library not found.',
          });
          return;
        }
      }
      let items: LibraryItem[] = [];
      if (library.type === 'webdav') {
        items = await repo.refreshWebDavLibrary(activeLibraryId);
      } else if (library.type === 'cloud-drive') {
        items = [];
      } else {
        items = await repo.listLibraryItems(activeLibraryId);
      }
      set({ libraries, libraryItems: items, libraryLoading: false });
    } catch (error) {
      set({
        libraryLoading: false,
        error: getErrorMessage(error, 'Failed to refresh library.'),
      });
    }
  },
  createLibrary: async (input) => {
    try {
      const repo = await getDesktopRepository();
      const library = await repo.createLibrary(input);
      const libraries = [library, ...get().libraries];
      set({ libraries, activeLibraryId: library.id });
      await get().selectLibrary(library.id);
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to create library.'),
      });
    }
  },
  createWebDavLibrary: async ({ name, baseUrl, username, password }) => {
    try {
      const repo = await getDesktopRepository();
      const library = await repo.createWebDavLibrary({
        name,
        baseUrl,
        username,
        password,
      });
      const libraries = [library, ...get().libraries];
      set({ libraries, activeLibraryId: library.id });
      await get().selectLibrary(library.id);
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to create WebDAV library.'),
      });
    }
  },
  createCloudDriveLibrary: async (name) => {
    await get().createLibrary({
      name,
      type: 'cloud-drive',
    });
  },
  deleteActiveLibrary: async () => {
    const { activeLibraryId, libraries } = get();
    if (!activeLibraryId) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      await repo.deleteLibrary(activeLibraryId);
      const remaining = libraries.filter((item) => item.id !== activeLibraryId);
      const next = remaining[0]?.id ?? null;
      set({
        libraries: remaining,
        activeLibraryId: next,
        libraryItems: [],
      });
      if (next) {
        await get().selectLibrary(next);
      }
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to delete library.'),
      });
    }
  },
  addManualItemToActive: async () => {
    const { activeLibraryId } = get();
    if (!activeLibraryId) {
      return;
    }
    try {
      const paths = await pickMediaFiles();
      if (!paths.length) {
        return;
      }
      const repo = await getDesktopRepository();
      const added: LibraryItem[] = [];
      for (const path of paths) {
        // eslint-disable-next-line no-await-in-loop
        const item = await repo.addManualLibraryItem(activeLibraryId, path);
        added.push(item);
      }
      if (added.length) {
        set((state) => ({
          libraryItems: [...added, ...state.libraryItems],
        }));
      }
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to add library item.'),
      });
    }
  },
  selectLibraryItem: (itemId) => set({ activeSourceId: itemId }),
  renameLibraryItem: async (itemId, nextName) => {
    const { activeLibraryId, libraries, libraryItems, activeSourceId } = get();
    if (!activeLibraryId) {
      return;
    }
    const library = libraries.find((item) => item.id === activeLibraryId);
    if (!library || library.type !== 'local-manual') {
      set({ error: 'Renaming files is only supported for local libraries.' });
      return;
    }
    const item = libraryItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      const updated = await repo.renameLibraryItem(item, nextName);
      if (!updated) {
        return;
      }
      set((state) => ({
        libraryItems: state.libraryItems.map((entry) => (entry.id === itemId ? updated : entry)),
        activeSourceId: activeSourceId === itemId ? itemId : state.activeSourceId,
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to rename file.'),
      });
    }
  },
  deleteLibraryItem: async (itemId) => {
    const { activeLibraryId, libraries, libraryItems, activeSourceId } = get();
    if (!activeLibraryId) {
      return;
    }
    const library = libraries.find((item) => item.id === activeLibraryId);
    if (!library || library.type !== 'local-manual') {
      set({ error: 'Deleting items is only supported for local libraries.' });
      return;
    }
    const item = libraryItems.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      await repo.deleteLibraryItem(item);
      set((state) => ({
        libraryItems: state.libraryItems.filter((entry) => entry.id !== itemId),
        activeSourceId: activeSourceId === itemId ? null : state.activeSourceId,
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to delete file.'),
      });
    }
  },
  clearActiveSource: () => set({ activeSourceId: null }),
  attachSubtitleToActive: async () => {
    const { activeSourceId } = get();
    const sourceSnapshot = getActiveMediaSourceSnapshot(get());
    if (!activeSourceId || !sourceSnapshot) {
      return;
    }
    try {
      const path = await pickSubtitleFile();
      if (!path) {
        return;
      }
      const repo = await getDesktopRepository();
      await repo.attachSubtitleTrack(activeSourceId, path, sourceSnapshot);
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to attach subtitles.'),
      });
    }
  },
  saveListeningItem: async (subtitle) => {
    const { activeSourceId } = get();
    const sourceSnapshot = getActiveMediaSourceSnapshot(get());
    if (!activeSourceId || !sourceSnapshot) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      const item = await repo.saveListeningItem(activeSourceId, subtitle, sourceSnapshot);
      if (!item) {
        return;
      }
      set((state) => ({
        listeningItems: [item, ...state.listeningItems],
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to save listening item.'),
      });
    }
  },
  updateListeningItemTitle: async (id, title) => {
    try {
      const repo = await getDesktopRepository();
      await repo.updateListeningItemTitle(id, title);
      set((state) => ({
        listeningItems: state.listeningItems.map((item) =>
          item.id === id
            ? {
                ...item,
                title,
              }
            : item,
        ),
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to update listening item.'),
      });
    }
  },
  toggleListeningItemFavorite: async (id) => {
    try {
      const repo = await getDesktopRepository();
      const current = get().listeningItems.find((item) => item.id === id);
      const nextFavorite = !(current?.isFavorite ?? false);
      await repo.updateListeningItemFavorite(id, nextFavorite);
      set((state) => ({
        listeningItems: state.listeningItems.map((item) =>
          item.id === id
            ? {
                ...item,
                isFavorite: nextFavorite,
                tags: nextFavorite ? ['Saved', 'Favorite'] : ['Saved'],
              }
            : item,
        ),
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to update favorite.'),
      });
    }
  },
  deleteListeningItem: async (id) => {
    try {
      const repo = await getDesktopRepository();
      await repo.deleteListeningItem(id);
      set((state) => ({
        listeningItems: state.listeningItems.filter((item) => item.id !== id),
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to delete listening item.'),
      });
    }
  },
  addVocabFromSubtitle: async (subtitle) => {
    const { activeSourceId } = get();
    const sourceSnapshot = getActiveMediaSourceSnapshot(get());
    if (!activeSourceId || !sourceSnapshot) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      const entry = await repo.upsertVocabFromSubtitle(activeSourceId, subtitle, sourceSnapshot);
      if (!entry) {
        return;
      }
      set((state) => {
        const existingIndex = state.vocabItems.findIndex(
          (item) => item.canonicalWord === entry.canonicalWord && item.locale === entry.locale,
        );
        if (existingIndex === -1) {
          return { vocabItems: [entry, ...state.vocabItems] };
        }
        const nextItems = [...state.vocabItems];
        nextItems[existingIndex] = entry;
        return { vocabItems: nextItems };
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to add vocabulary.'),
      });
    }
  },
  addVocabFromLookup: async (input) => {
    const { activeSourceId } = get();
    const sourceSnapshot = getActiveMediaSourceSnapshot(get());
    if (!activeSourceId || !sourceSnapshot) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      const entry = await repo.upsertVocabFromLookup(activeSourceId, input, sourceSnapshot);
      if (!entry) {
        return;
      }
      set((state) => {
        const existingIndex = state.vocabItems.findIndex(
          (item) => item.canonicalWord === entry.canonicalWord && item.locale === entry.locale,
        );
        if (existingIndex === -1) {
          return { vocabItems: [entry, ...state.vocabItems] };
        }
        const nextItems = [...state.vocabItems];
        nextItems[existingIndex] = entry;
        return { vocabItems: nextItems };
      });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to add vocabulary.'),
      });
    }
  },
  toggleVocabFavorite: async (id) => {
    try {
      const current = get().vocabItems.find((item) => item.id === id);
      if (!current) {
        return;
      }
      const repo = await getDesktopRepository();
      const updated = await repo.updateVocabItem(id, { isFavorite: !current.isFavorite });
      if (!updated) {
        return;
      }
      set((state) => ({
        vocabItems: state.vocabItems.map((item) => (item.id === id ? updated : item)),
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to update vocabulary.'),
      });
    }
  },
  toggleVocabMastered: async (id) => {
    try {
      const current = get().vocabItems.find((item) => item.id === id);
      if (!current) {
        return;
      }
      const repo = await getDesktopRepository();
      const updated = await repo.updateVocabItem(id, { isMastered: !current.isMastered });
      if (!updated) {
        return;
      }
      set((state) => ({
        vocabItems: state.vocabItems.map((item) => (item.id === id ? updated : item)),
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to update vocabulary.'),
      });
    }
  },
  deleteVocabItem: async (id) => {
    try {
      const repo = await getDesktopRepository();
      await repo.deleteVocabItem(id);
      set((state) => ({
        vocabItems: state.vocabItems.filter((item) => item.id !== id),
      }));
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to delete vocabulary.'),
      });
    }
  },
  recordRecentPlayback: async (progress) => {
    const { activeSourceId } = get();
    const sourceSnapshot = getActiveMediaSourceSnapshot(get());
    if (!activeSourceId || !sourceSnapshot) {
      return;
    }
    try {
      const repo = await getDesktopRepository();
      await repo.recordRecentPlayback(activeSourceId, progress, sourceSnapshot);
      const recentItems = await repo.listRecents();
      set({ recentItems });
    } catch (error) {
      set({
        error: getErrorMessage(error, 'Failed to update recents.'),
      });
    }
  },
}));

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === 'string' && error.trim()) {
    return error;
  }
  return fallback;
}
