import { create } from 'zustand';
import type {
  Library,
  LibraryItem,
  LibraryType,
  ListeningItem,
  RecentItem,
  VocabItem,
  SubtitleItem,
} from '@audixa/utils';
import { getErrorMessage } from '@audixa/utils';

/**
 * Input for creating a new library
 */
type LibraryCreateInput = {
  name: string;
  type: LibraryType;
  pathOrUrl?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Mobile Data Store State
 */
type MobileDataState = {
  // Data
  libraries: Library[];
  libraryItems: LibraryItem[];
  listeningItems: ListeningItem[];
  vocabItems: VocabItem[];
  recentItems: RecentItem[];
  subtitleItems: SubtitleItem[];

  // Selection
  activeLibraryId: string | null;
  activeSourceId: string | null;

  // Loading state
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAll: () => Promise<void>;
  selectLibrary: (libraryId: string) => Promise<void>;
  createLibrary: (input: LibraryCreateInput) => Promise<void>;
  deleteLibrary: (libraryId: string) => Promise<void>;
  selectSource: (sourceId: string) => void;
  clearSource: () => void;

  // Listening items
  addListeningItem: (item: Omit<ListeningItem, 'id' | 'createdAt'>) => Promise<void>;
  toggleListeningFavorite: (id: string) => Promise<void>;
  deleteListeningItem: (id: string) => Promise<void>;

  // Vocabulary
  addVocabItem: (item: Omit<VocabItem, 'id' | 'createdAt' | 'lastSeenAt'>) => Promise<void>;
  toggleVocabFavorite: (id: string) => Promise<void>;
  toggleVocabMastered: (id: string) => Promise<void>;
  deleteVocabItem: (id: string) => Promise<void>;

  // Recent
  recordRecentPlayback: (item: Omit<RecentItem, 'id' | 'lastPlayedAt'>) => Promise<void>;
  deleteRecentItem: (id: string) => Promise<void>;

  // Subtitles
  setSubtitleItems: (items: SubtitleItem[]) => void;
};

/**
 * Generate a simple UUID
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Mobile Data Store
 *
 * Note: This is a placeholder implementation using in-memory storage.
 * The actual SQLite implementation will be added in phase5-storage.
 */
export const useMobileDataStore = create<MobileDataState>((set, get) => ({
  // Initial state
  libraries: [],
  libraryItems: [],
  listeningItems: [],
  vocabItems: [],
  recentItems: [],
  subtitleItems: [],
  activeLibraryId: null,
  activeSourceId: null,
  isLoading: false,
  error: null,

  // Load all data
  loadAll: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Load from SQLite when implemented
      // For now, use placeholder data
      const libraries: Library[] = [
        {
          id: 'local-1',
          name: 'Local Files',
          type: 'local-manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      set({
        libraries,
        activeLibraryId: libraries[0]?.id ?? null,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load data'),
      });
    }
  },

  selectLibrary: async (libraryId) => {
    set({ activeLibraryId: libraryId, isLoading: true });
    try {
      // TODO: Load library items from storage
      set({ isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: getErrorMessage(error, 'Failed to load library'),
      });
    }
  },

  createLibrary: async (input) => {
    try {
      const library: Library = {
        id: generateId(),
        name: input.name,
        type: input.type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((state) => ({
        libraries: [library, ...state.libraries],
        activeLibraryId: library.id,
      }));
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to create library') });
    }
  },

  deleteLibrary: async (libraryId) => {
    try {
      set((state) => {
        const remaining = state.libraries.filter((l) => l.id !== libraryId);
        return {
          libraries: remaining,
          activeLibraryId: state.activeLibraryId === libraryId
            ? (remaining[0]?.id ?? null)
            : state.activeLibraryId,
        };
      });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to delete library') });
    }
  },

  selectSource: (sourceId) => set({ activeSourceId: sourceId }),
  clearSource: () => set({ activeSourceId: null }),

  // Listening items
  addListeningItem: async (item) => {
    try {
      const newItem: ListeningItem = {
        ...item,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        listeningItems: [newItem, ...state.listeningItems],
      }));
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to add listening item') });
    }
  },

  toggleListeningFavorite: async (id) => {
    set((state) => ({
      listeningItems: state.listeningItems.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      ),
    }));
  },

  deleteListeningItem: async (id) => {
    set((state) => ({
      listeningItems: state.listeningItems.filter((item) => item.id !== id),
    }));
  },

  // Vocabulary
  addVocabItem: async (item) => {
    try {
      const now = new Date().toISOString();
      const newItem: VocabItem = {
        ...item,
        id: generateId(),
        createdAt: now,
        lastSeenAt: now,
      };
      set((state) => ({
        vocabItems: [newItem, ...state.vocabItems],
      }));
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to add vocabulary') });
    }
  },

  toggleVocabFavorite: async (id) => {
    set((state) => ({
      vocabItems: state.vocabItems.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      ),
    }));
  },

  toggleVocabMastered: async (id) => {
    set((state) => ({
      vocabItems: state.vocabItems.map((item) =>
        item.id === id ? { ...item, isMastered: !item.isMastered } : item
      ),
    }));
  },

  deleteVocabItem: async (id) => {
    set((state) => ({
      vocabItems: state.vocabItems.filter((item) => item.id !== id),
    }));
  },

  // Recent
  recordRecentPlayback: async (item) => {
    try {
      const newItem: RecentItem = {
        ...item,
        id: generateId(),
        lastPlayedAt: new Date().toISOString(),
      };
      set((state) => {
        // Update existing or add new
        const existing = state.recentItems.find(
          (r) => r.mediaSourceId === item.mediaSourceId
        );
        if (existing) {
          return {
            recentItems: state.recentItems.map((r) =>
              r.id === existing.id
                ? { ...newItem, id: r.id }
                : r
            ),
          };
        }
        return {
          recentItems: [newItem, ...state.recentItems].slice(0, 50), // Keep max 50
        };
      });
    } catch (error) {
      set({ error: getErrorMessage(error, 'Failed to record playback') });
    }
  },

  deleteRecentItem: async (id) => {
    set((state) => ({
      recentItems: state.recentItems.filter((item) => item.id !== id),
    }));
  },

  // Subtitles
  setSubtitleItems: (items) => set({ subtitleItems: items }),
}));
