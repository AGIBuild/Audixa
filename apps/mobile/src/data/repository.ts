/**
 * Mobile Repository
 *
 * Provides data access layer for the mobile app.
 * Abstracts SQLite operations behind a clean interface.
 *
 * Note: This is a placeholder that uses in-memory storage.
 * Real implementation will use react-native-sqlite-storage.
 */

import type {
  Library,
  LibraryItem,
  ListeningItem,
  VocabItem,
  RecentItem,
  SubtitleItem,
} from '@audixa/utils';
import { nowIso, generateUuid } from '@audixa/utils';

/**
 * In-memory storage (placeholder)
 */
const storage = {
  libraries: new Map<string, Library>(),
  libraryItems: new Map<string, LibraryItem>(),
  listeningItems: new Map<string, ListeningItem>(),
  vocabItems: new Map<string, VocabItem>(),
  recentItems: new Map<string, RecentItem>(),
};

/**
 * Mobile Repository Interface
 */
export interface MobileRepository {
  // Libraries
  listLibraries: () => Promise<Library[]>;
  createLibrary: (name: string, type: Library['type']) => Promise<Library>;
  deleteLibrary: (id: string) => Promise<void>;

  // Library Items
  listLibraryItems: (libraryId: string) => Promise<LibraryItem[]>;
  addLibraryItem: (item: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<LibraryItem>;
  deleteLibraryItem: (id: string) => Promise<void>;

  // Listening Items
  listListeningItems: () => Promise<ListeningItem[]>;
  addListeningItem: (item: Omit<ListeningItem, 'id' | 'createdAt'>) => Promise<ListeningItem>;
  updateListeningItem: (id: string, updates: Partial<ListeningItem>) => Promise<void>;
  deleteListeningItem: (id: string) => Promise<void>;

  // Vocabulary
  listVocabItems: () => Promise<VocabItem[]>;
  addVocabItem: (item: Omit<VocabItem, 'id' | 'createdAt' | 'lastSeenAt'>) => Promise<VocabItem>;
  updateVocabItem: (id: string, updates: Partial<VocabItem>) => Promise<void>;
  deleteVocabItem: (id: string) => Promise<void>;

  // Recent
  listRecentItems: () => Promise<RecentItem[]>;
  recordRecent: (item: Omit<RecentItem, 'id' | 'lastPlayedAt'>) => Promise<RecentItem>;
  deleteRecentItem: (id: string) => Promise<void>;
}

/**
 * Create an in-memory repository (placeholder)
 */
export function createInMemoryRepository(): MobileRepository {
  return {
    // Libraries
    listLibraries: async () => {
      return Array.from(storage.libraries.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    },

    createLibrary: async (name, type) => {
      const now = nowIso();
      const library: Library = {
        id: generateUuid(),
        name,
        type,
        createdAt: now,
        updatedAt: now,
      };
      storage.libraries.set(library.id, library);
      return library;
    },

    deleteLibrary: async (id) => {
      storage.libraries.delete(id);
      // Also delete related items
      for (const [itemId, item] of storage.libraryItems) {
        if (item.libraryId === id) {
          storage.libraryItems.delete(itemId);
        }
      }
    },

    // Library Items
    listLibraryItems: async (libraryId) => {
      return Array.from(storage.libraryItems.values())
        .filter((item) => item.libraryId === libraryId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },

    addLibraryItem: async (item) => {
      const now = nowIso();
      const newItem: LibraryItem = {
        ...item,
        id: generateUuid(),
        createdAt: now,
        updatedAt: now,
      };
      storage.libraryItems.set(newItem.id, newItem);
      return newItem;
    },

    deleteLibraryItem: async (id) => {
      storage.libraryItems.delete(id);
    },

    // Listening Items
    listListeningItems: async () => {
      return Array.from(storage.listeningItems.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },

    addListeningItem: async (item) => {
      const newItem: ListeningItem = {
        ...item,
        id: generateUuid(),
        createdAt: nowIso(),
      };
      storage.listeningItems.set(newItem.id, newItem);
      return newItem;
    },

    updateListeningItem: async (id, updates) => {
      const existing = storage.listeningItems.get(id);
      if (existing) {
        storage.listeningItems.set(id, { ...existing, ...updates });
      }
    },

    deleteListeningItem: async (id) => {
      storage.listeningItems.delete(id);
    },

    // Vocabulary
    listVocabItems: async () => {
      return Array.from(storage.vocabItems.values()).sort(
        (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
      );
    },

    addVocabItem: async (item) => {
      const now = nowIso();
      const newItem: VocabItem = {
        ...item,
        id: generateUuid(),
        createdAt: now,
        lastSeenAt: now,
      };
      storage.vocabItems.set(newItem.id, newItem);
      return newItem;
    },

    updateVocabItem: async (id, updates) => {
      const existing = storage.vocabItems.get(id);
      if (existing) {
        storage.vocabItems.set(id, {
          ...existing,
          ...updates,
          lastSeenAt: nowIso(),
        });
      }
    },

    deleteVocabItem: async (id) => {
      storage.vocabItems.delete(id);
    },

    // Recent
    listRecentItems: async () => {
      return Array.from(storage.recentItems.values()).sort(
        (a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime()
      );
    },

    recordRecent: async (item) => {
      // Check if already exists
      const existing = Array.from(storage.recentItems.values()).find(
        (r) => r.mediaSourceId === item.mediaSourceId
      );

      if (existing) {
        const updated: RecentItem = {
          ...existing,
          ...item,
          lastPlayedAt: nowIso(),
        };
        storage.recentItems.set(existing.id, updated);
        return updated;
      }

      const newItem: RecentItem = {
        ...item,
        id: generateUuid(),
        lastPlayedAt: nowIso(),
      };
      storage.recentItems.set(newItem.id, newItem);
      return newItem;
    },

    deleteRecentItem: async (id) => {
      storage.recentItems.delete(id);
    },
  };
}

/**
 * Default repository instance
 */
let repositoryInstance: MobileRepository | null = null;

/**
 * Get the repository instance
 */
export function getMobileRepository(): MobileRepository {
  if (!repositoryInstance) {
    repositoryInstance = createInMemoryRepository();
  }
  return repositoryInstance;
}
