import type {
  Library,
  LibraryItem,
  LibrarySource,
  LibraryType,
  ListeningItem,
  RecentItem,
  SourceItem,
  SubtitleItem,
  VocabItem,
} from './types';
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
} from './store';
import { getSqlClient } from './sqliteClient';
import { rename, stat } from '@tauri-apps/plugin-fs';
import { createSqliteStore } from './sqliteStore';
import { saveWebDavPassword, readWebDavPassword } from './keyring';
import { listWebDavMedia } from './webdavClient';
import {
  canonicalizeWord,
  createId,
  extractFirstWord,
  formatDurationMs,
  getFileName,
  getFileStem,
  getParentPath,
  inferMediaKind,
} from './utils';

type MediaSourceInput = {
  id: string;
  title: string;
  uri: string;
  kind: SourceItem['kind'];
};

type VocabLookupInput = {
  word: string;
  definition?: string;
  pronunciation?: string | null;
  example?: string;
};

type VocabItemUpdate = {
  definition?: string;
  example?: string;
  pronunciation?: string | null;
  isFavorite?: boolean;
  isMastered?: boolean;
};

export type DesktopRepository = {
  listSources: () => Promise<SourceItem[]>;
  listRecents: () => Promise<RecentItem[]>;
  listListeningItems: () => Promise<ListeningItem[]>;
  listVocabItems: () => Promise<VocabItem[]>;
  listLibraries: () => Promise<Library[]>;
  createLibrary: (input: {
    name: string;
    type: LibraryType;
    pathOrUrl?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<Library>;
  listLibrarySources: (libraryId: string) => Promise<LibrarySource[]>;
  listLibraryItems: (libraryId: string) => Promise<LibraryItem[]>;
  addManualLibraryItem: (libraryId: string, path: string) => Promise<LibraryItem>;
  createWebDavLibrary: (input: {
    name: string;
    baseUrl: string;
    username: string;
    password: string;
  }) => Promise<Library>;
  refreshWebDavLibrary: (libraryId: string) => Promise<LibraryItem[]>;
  deleteLibrary: (libraryId: string) => Promise<void>;
  upsertLibraryCredential: (libraryId: string, keyringKey: string) => Promise<void>;
  getLibraryCredential: (libraryId: string) => Promise<string | null>;
  addMediaSourceFromPath: (path: string) => Promise<SourceItem>;
  attachSubtitleTrack: (
    mediaSourceId: string,
    path: string,
    source?: MediaSourceInput,
  ) => Promise<void>;
  saveListeningItem: (
    mediaSourceId: string,
    subtitle: SubtitleItem,
    source?: MediaSourceInput,
  ) => Promise<ListeningItem | null>;
  updateListeningItemTitle: (listeningItemId: string, title: string | null) => Promise<void>;
  updateListeningItemFavorite: (listeningItemId: string, isFavorite: boolean) => Promise<void>;
  deleteListeningItem: (listeningItemId: string) => Promise<void>;
  recordRecentPlayback: (
    mediaSourceId: string,
    progress: number,
    source?: MediaSourceInput,
  ) => Promise<void>;
  deleteRecentItem: (id: string) => Promise<void>;
  upsertVocabFromSubtitle: (
    mediaSourceId: string,
    subtitle: SubtitleItem,
    source?: MediaSourceInput,
  ) => Promise<VocabItem | null>;
  upsertVocabFromLookup: (
    mediaSourceId: string,
    input: VocabLookupInput,
    source?: MediaSourceInput,
  ) => Promise<VocabItem | null>;
  updateVocabItem: (vocabId: string, update: VocabItemUpdate) => Promise<VocabItem | null>;
  deleteVocabItem: (vocabId: string) => Promise<void>;
  renameLibraryItem: (item: LibraryItem, newName: string) => Promise<LibraryItem | null>;
  deleteLibraryItem: (item: LibraryItem) => Promise<void>;
  getAppSetting: (key: string) => Promise<string | null>;
  setAppSetting: (key: string, value: string) => Promise<void>;
};

let repositoryPromise: Promise<DesktopRepository> | null = null;

export async function getDesktopRepository() {
  if (!repositoryPromise) {
    repositoryPromise = (async () => {
      const client = await getSqlClient();
      const store = createSqliteStore(client);
      return createRepository(store);
    })();
  }
  return repositoryPromise;
}

export function createRepository(store: DesktopDataStore): DesktopRepository {
  return {
    async listSources() {
      const records = await store.listMediaSources();
      return records.map(mapSource);
    },
    async listRecents() {
      const [sources, recents, libraries] = await Promise.all([
        store.listMediaSources(),
        store.listRecentPlaybacks(),
        store.listLibraries(),
      ]);
      // Load all library items to find which library each source belongs to.
      const allLibraryItems = await Promise.all(
        libraries.map((lib) => store.listLibraryItems(lib.id)),
      );
      // Build a map from URI to library name.
      const uriToLibraryName = new Map<string, string>();
      libraries.forEach((lib, index) => {
        const items = allLibraryItems[index];
        for (const item of items) {
          uriToLibraryName.set(item.uri, lib.name);
        }
      });

      // Limit to 10 most recent items.
      const limitedRecents = recents.slice(0, 10);
      const mapped = mapRecentsSync(limitedRecents, sources, uriToLibraryName);
      // Check file validity in parallel.
      const validityResults = await Promise.all(
        mapped.map((item) => checkFileExists(item.uri)),
      );
      return mapped.map((item, index) => ({
        ...item,
        isValid: validityResults[index],
      }));
    },
    async listListeningItems() {
      const [sources, items] = await Promise.all([
        store.listMediaSources(),
        store.listListeningItems(),
      ]);
      return mapListeningItems(items, sources);
    },
    async listVocabItems() {
      const records = await store.listVocabItems();
      return records.map(mapVocab);
    },
    async listLibraries() {
      const libraries = await ensureDefaultLibrary(store);
      return libraries.map(mapLibrary);
    },
    async createLibrary(input) {
      const now = new Date().toISOString();
      const libraryRecord: LibraryRecord = {
        id: createId(),
        name: input.name,
        type: input.type,
        createdAt: now,
        updatedAt: now,
      };
      await store.insertLibrary(libraryRecord);
      const sourceRecord: LibrarySourceRecord = {
        id: createId(),
        libraryId: libraryRecord.id,
        kind: input.type,
        pathOrUrl: input.pathOrUrl ?? '',
        metadataJson: JSON.stringify(input.metadata ?? {}),
        createdAt: now,
      };
      await store.insertLibrarySource(sourceRecord);
      return mapLibrary(libraryRecord);
    },
    async listLibrarySources(libraryId) {
      const records = await store.listLibrarySources(libraryId);
      return records.map(mapLibrarySource);
    },
    async listLibraryItems(libraryId) {
      await ensureDefaultLibrary(store);
      const records = await store.listLibraryItems(libraryId);
      return records.map(mapLibraryItem);
    },
    async addManualLibraryItem(libraryId, path) {
      const [sourceRecord] = await store.listLibrarySources(libraryId);
      if (!sourceRecord) {
        throw new Error('Library source is missing.');
      }
      const now = new Date().toISOString();
      const mediaSource = await getOrCreateMediaSource(store, path, now);
      const record: LibraryItemRecord = {
        id: createId(),
        libraryId,
        sourceId: sourceRecord.id,
        title: mediaSource.title,
        uri: mediaSource.uri,
        kind: mediaSource.kind,
        createdAt: now,
        updatedAt: now,
      };
      await store.upsertLibraryItem(record);
      await store.updateLibraryTimestamp(libraryId, now);
      return mapLibraryItem(record);
    },
    async createWebDavLibrary({ name, baseUrl, username, password }) {
      const library = await this.createLibrary({
        name,
        type: 'webdav',
        pathOrUrl: baseUrl,
        metadata: { username },
      });
      const keyringKey = `webdav:${library.id}`;
      await saveWebDavPassword(keyringKey, password);
      await this.upsertLibraryCredential(library.id, keyringKey);
      return library;
    },
    async refreshWebDavLibrary(libraryId) {
      const sources = await store.listLibrarySources(libraryId);
      const sourceRecord = sources[0];
      if (!sourceRecord) {
        throw new Error('Library source is missing.');
      }
      const source = mapLibrarySource(sourceRecord);
      const username = String(source.metadata.username ?? '');
      if (!username) {
        throw new Error('WebDAV username is missing.');
      }
      const keyringKey = await this.getLibraryCredential(libraryId);
      if (!keyringKey) {
        throw new Error('WebDAV credentials not found.');
      }
      const password = await readWebDavPassword(keyringKey);
      const now = new Date().toISOString();
      const fetched = await listWebDavMedia(source.pathOrUrl, username, password);
      const existing = await store.listLibraryItems(libraryId);
      const existingByUri = new Map(existing.map((item) => [item.uri, item]));
      const seen = new Set<string>();

      for (const item of fetched) {
        const mediaSource = await getOrCreateMediaSource(store, item.uri, now);
        const previous = existingByUri.get(item.uri);
        const record: LibraryItemRecord = {
          id: previous?.id ?? createId(),
          libraryId,
          sourceId: sourceRecord.id,
          title: item.title,
          uri: item.uri,
          kind: item.kind,
          createdAt: previous?.createdAt ?? now,
          updatedAt: now,
        };
        await store.upsertLibraryItem(record);
        seen.add(item.uri);
      }

      for (const item of existing) {
        if (!seen.has(item.uri)) {
          await store.deleteLibraryItemByUri(libraryId, item.uri);
        }
      }

      await store.updateLibraryTimestamp(libraryId, now);
      const updated = await store.listLibraryItems(libraryId);
      return updated.map(mapLibraryItem);
    },
    async deleteLibrary(libraryId) {
      await store.deleteLibraryItemsByLibraryId(libraryId);
      await store.deleteLibrarySourcesByLibraryId(libraryId);
      await store.deleteLibraryCredentialsByLibraryId(libraryId);
      await store.deleteLibrary(libraryId);
      await store.upsertAppState({
        key: 'library_migration_done',
        value: 'true',
        updatedAt: new Date().toISOString(),
      });
    },
    async upsertLibraryCredential(libraryId, keyringKey) {
      const record: LibraryCredentialRecord = {
        id: createId(),
        libraryId,
        keyringKey,
        createdAt: new Date().toISOString(),
      };
      await store.upsertLibraryCredential(record);
    },
    async getLibraryCredential(libraryId) {
      const records = await store.listLibraryCredentials(libraryId);
      return records[0]?.keyringKey ?? null;
    },
    async addMediaSourceFromPath(path) {
      const now = new Date().toISOString();
      const record: MediaSourceRecord = {
        id: createId(),
        title: getFileStem(getFileName(path)),
        uri: path,
        kind: inferMediaKind(path),
        createdAt: now,
        updatedAt: now,
      };
      await store.insertMediaSource(record);
      return mapSource(record);
    },
    async attachSubtitleTrack(mediaSourceId, path, source) {
      const ensured = await ensureMediaSource(store, mediaSourceId, source);
      if (!ensured) {
        throw new Error('Media source not found.');
      }
      const record: SubtitleTrackRecord = {
        id: createId(),
        mediaSourceId,
        language: 'und',
        uri: path,
        createdAt: new Date().toISOString(),
      };
      await store.insertSubtitleTrack(record);
    },
    async saveListeningItem(mediaSourceId, subtitle, source) {
      const sourceRecord = await ensureMediaSource(store, mediaSourceId, source);
      if (!sourceRecord) {
        return null;
      }
      const sentenceText = subtitle.en || subtitle.cn || '';
      if (!sentenceText) {
        return null;
      }
      const record: ListeningItemRecord = {
        id: createId(),
        mediaSourceId,
        sentenceId: subtitle.id,
        sentenceText,
        startMs: subtitle.startMs,
        endMs: subtitle.endMs,
        createdAt: new Date().toISOString(),
        titleOverride: null,
        isFavorite: 0,
      };
      await store.insertListeningItem(record);
      return mapListeningItem(record, sourceRecord);
    },
    async updateListeningItemTitle(listeningItemId, title) {
      await store.updateListeningItemTitle(listeningItemId, title?.trim() || null);
    },
    async updateListeningItemFavorite(listeningItemId, isFavorite) {
      await store.updateListeningItemFavorite(listeningItemId, isFavorite ? 1 : 0);
    },
    async deleteListeningItem(listeningItemId) {
      await store.deleteListeningItem(listeningItemId);
    },
    async recordRecentPlayback(mediaSourceId, progress, source) {
      const ensured = await ensureMediaSource(store, mediaSourceId, source);
      if (!ensured) {
        return;
      }
      const record: RecentPlaybackRecord = {
        id: createId(),
        mediaSourceId,
        progress: clampProgress(progress),
        lastPlayedAt: new Date().toISOString(),
      };
      await store.upsertRecentPlayback(record);
    },
    async deleteRecentItem(id) {
      await store.deleteRecentPlayback(id);
    },
    async upsertVocabFromSubtitle(mediaSourceId, subtitle, source) {
      const sourceRecord = await ensureMediaSource(store, mediaSourceId, source);
      if (!sourceRecord) {
        return null;
      }
      const word = extractFirstWord(subtitle.en);
      if (!word) {
        return null;
      }
      const now = new Date().toISOString();
      const record = buildVocabRecord({
        word,
        definition: 'Definition pending.',
        example: subtitle.en,
        source: sourceRecord.title,
        pronunciation: null,
        now,
      });
      await store.upsertVocabItem(record);
      const entries = await store.listVocabItems();
      return entries.map(mapVocab).find((item) => item.canonicalWord === record.canonicalWord) ?? null;
    },
    async upsertVocabFromLookup(mediaSourceId, input, source) {
      const sourceRecord = await ensureMediaSource(store, mediaSourceId, source);
      if (!sourceRecord) {
        return null;
      }
      const word = input.word.trim();
      if (!word) {
        return null;
      }
      const now = new Date().toISOString();
      const record = buildVocabRecord({
        word,
        definition: input.definition?.trim() || 'Definition unavailable.',
        example: input.example?.trim() || word,
        source: sourceRecord.title,
        pronunciation: input.pronunciation ?? null,
        now,
      });
      await store.upsertVocabItem(record);
      const entries = await store.listVocabItems();
      return entries.map(mapVocab).find((item) => item.canonicalWord === record.canonicalWord) ?? null;
    },
    async updateVocabItem(vocabId, update) {
      const records = await store.listVocabItems();
      const record = records.find((item) => item.id === vocabId);
      if (!record) {
        return null;
      }
      const nextRecord: VocabItemRecord = {
        ...record,
        definition: update.definition ?? record.definition,
        example: update.example ?? record.example,
        pronunciation: update.pronunciation ?? record.pronunciation,
        isFavorite:
          update.isFavorite === undefined ? record.isFavorite : update.isFavorite ? 1 : 0,
        isMastered:
          update.isMastered === undefined ? record.isMastered : update.isMastered ? 1 : 0,
      };
      await store.updateVocabItem(nextRecord);
      return mapVocab(nextRecord);
    },
    async deleteVocabItem(vocabId) {
      await store.deleteVocabItem(vocabId);
    },
    async renameLibraryItem(item, newName) {
      const nextName = newName.trim();
      if (!nextName) {
        return null;
      }
      const { nextPath, nextTitle } = buildRenamedPath(item.uri, nextName);
      if (nextPath === item.uri) {
        return item;
      }
      await rename(item.uri, nextPath);
      const now = new Date().toISOString();
      const updatedItem: LibraryItemRecord = {
        id: item.id,
        libraryId: item.libraryId,
        sourceId: item.sourceId,
        title: nextTitle,
        uri: nextPath,
        kind: inferMediaKind(nextPath),
        createdAt: item.createdAt,
        updatedAt: now,
      };
      await store.updateLibraryItem(updatedItem);
      const mediaSource = await store.findMediaSourceByUri(item.uri);
      if (mediaSource) {
        await store.updateMediaSource({
          ...mediaSource,
          title: nextTitle,
          uri: nextPath,
          kind: inferMediaKind(nextPath),
          updatedAt: now,
        });
      }
      return mapLibraryItem(updatedItem);
    },
    async deleteLibraryItem(item) {
      await store.deleteLibraryItem(item.id);
    },
    async getAppSetting(key) {
      const record = await store.getAppState(key);
      return record?.value ?? null;
    },
    async setAppSetting(key, value) {
      await store.upsertAppState({
        key,
        value,
        updatedAt: new Date().toISOString(),
      });
    },
  };
}

function mapSource(record: MediaSourceRecord): SourceItem {
  const kind = normalizeMediaKind(record.kind);
  const subtitle = getParentPath(record.uri) || getMediaKindLabel(kind);
  return {
    id: record.id,
    title: record.title,
    subtitle,
    uri: record.uri,
    kind,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapRecentsSync(
  records: RecentPlaybackRecord[],
  sources: MediaSourceRecord[],
  uriToLibraryName: Map<string, string>,
): Omit<RecentItem, 'isValid'>[] {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return records.map((record) => {
    const source = sourceMap.get(record.mediaSourceId);
    const uri = source?.uri ?? '';
    const location = uri || 'Unknown source';
    const libraryName = uriToLibraryName.get(uri) ?? null;
    return {
      id: record.id,
      mediaSourceId: record.mediaSourceId,
      title: source?.title ?? 'Unknown media',
      location,
      uri,
      libraryName,
      progress: record.progress,
      lastPlayedAt: record.lastPlayedAt,
    };
  });
}

async function checkFileExists(uri: string): Promise<boolean> {
  if (!uri) {
    return false;
  }
  // Skip remote URLs - assume they are valid.
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return true;
  }
  try {
    await stat(uri);
    return true;
  } catch (err) {
    // Only log unexpected errors, not "file not found" errors.
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (!errorMessage.includes('not found') && !errorMessage.includes('No such file')) {
      console.warn('[repository] checkFileExists error for:', uri, errorMessage);
    }
    return false;
  }
}

function mapListeningItems(
  records: ListeningItemRecord[],
  sources: MediaSourceRecord[],
): ListeningItem[] {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  return records.map((record) => mapListeningItem(record, sourceMap.get(record.mediaSourceId)));
}

function mapListeningItem(
  record: ListeningItemRecord,
  source?: MediaSourceRecord,
): ListeningItem {
  const duration = formatDurationMs(record.endMs - record.startMs);
  const title = record.titleOverride?.trim() || record.sentenceText;
  const isFavorite = Boolean(record.isFavorite);
  return {
    id: record.id,
    mediaSourceId: record.mediaSourceId,
    title,
    source: source?.title ?? 'Unknown media',
    tags: isFavorite ? ['Saved', 'Favorite'] : ['Saved'],
    duration,
    progress: 0,
    isFavorite,
    sentenceId: record.sentenceId,
    startMs: record.startMs,
    endMs: record.endMs,
    createdAt: record.createdAt,
  };
}

function mapVocab(record: VocabItemRecord): VocabItem {
  return {
    id: record.id,
    word: record.word,
    pronunciation: record.pronunciation ?? null,
    isFavorite: Boolean(record.isFavorite),
    isMastered: Boolean(record.isMastered),
    definition: record.definition,
    example: record.example,
    source: record.source,
    canonicalWord: record.canonicalWord,
    locale: record.locale,
    createdAt: record.createdAt,
    lastSeenAt: record.lastSeenAt,
  };
}

function buildVocabRecord({
  word,
  definition,
  example,
  source,
  pronunciation,
  now,
}: {
  word: string;
  definition: string;
  example: string;
  source: string;
  pronunciation: string | null;
  now: string;
}): VocabItemRecord {
  return {
    id: createId(),
    word,
    canonicalWord: canonicalizeWord(word),
    locale: 'en',
    definition,
    example,
    source,
    pronunciation,
    isFavorite: 0,
    isMastered: 0,
    createdAt: now,
    lastSeenAt: now,
  };
}

function buildRenamedPath(oldPath: string, nextName: string) {
  const useBackslash = oldPath.includes('\\');
  const normalized = oldPath.replace(/\\/g, '/');
  const directory = getParentPath(normalized);
  const fileName = getFileName(oldPath);
  const extension = fileName.includes('.') ? fileName.split('.').pop() ?? '' : '';
  const nextFileName =
    !nextName.includes('.') && extension ? `${nextName}.${extension}` : nextName;
  const joined = directory ? `${directory}/${nextFileName}` : nextFileName;
  return {
    nextPath: useBackslash ? joined.replace(/\//g, '\\') : joined,
    nextTitle: getFileStem(nextFileName),
  };
}

function mapLibrary(record: LibraryRecord): Library {
  return {
    id: record.id,
    name: record.name,
    type: normalizeLibraryType(record.type),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapLibrarySource(record: LibrarySourceRecord): LibrarySource {
  let metadata: Record<string, unknown> = {};
  try {
    metadata = JSON.parse(record.metadataJson || '{}') as Record<string, unknown>;
  } catch {
    metadata = {};
  }
  return {
    id: record.id,
    libraryId: record.libraryId,
    kind: normalizeLibraryType(record.kind),
    pathOrUrl: record.pathOrUrl,
    metadata,
    createdAt: record.createdAt,
  };
}

function mapLibraryItem(record: LibraryItemRecord): LibraryItem {
  return {
    id: record.id,
    libraryId: record.libraryId,
    sourceId: record.sourceId,
    title: record.title,
    uri: record.uri,
    kind: normalizeMediaKind(record.kind),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getSourceById(store: DesktopDataStore, mediaSourceId: string) {
  const sources = await store.listMediaSources();
  return sources.find((source) => source.id === mediaSourceId);
}

async function ensureMediaSource(
  store: DesktopDataStore,
  mediaSourceId: string,
  source?: MediaSourceInput,
): Promise<MediaSourceRecord | null> {
  const existing = await getSourceById(store, mediaSourceId);
  if (existing) {
    return existing;
  }
  if (!source) {
    return null;
  }
  const now = new Date().toISOString();
  const record: MediaSourceRecord = {
    id: mediaSourceId,
    title: source.title,
    uri: source.uri,
    kind: source.kind,
    createdAt: now,
    updatedAt: now,
  };
  await store.insertMediaSource(record);
  return record;
}

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

function normalizeMediaKind(kind: string): SourceItem['kind'] {
  if (kind === 'audio' || kind === 'video' || kind === 'unknown') {
    return kind;
  }
  return 'unknown';
}

function getMediaKindLabel(kind: SourceItem['kind']) {
  switch (kind) {
    case 'audio':
      return 'Audio file';
    case 'video':
      return 'Video file';
    default:
      return 'Local file';
  }
}

function normalizeLibraryType(type: string): LibraryType {
  switch (type) {
    case 'local-manual':
    case 'webdav':
    case 'cloud-drive':
      return type;
    case 'local-folder':
      return 'local-manual';
    default:
      return 'local-manual';
  }
}

async function getOrCreateMediaSource(
  store: DesktopDataStore,
  uri: string,
  now: string,
): Promise<MediaSourceRecord> {
  const existing = await store.findMediaSourceByUri(uri);
  if (existing) {
    return existing;
  }
  const record: MediaSourceRecord = {
    id: createId(),
    title: getFileStem(getFileName(uri)),
    uri,
    kind: inferMediaKind(uri),
    createdAt: now,
    updatedAt: now,
  };
  await store.insertMediaSource(record);
  return record;
}

async function ensureDefaultLibrary(store: DesktopDataStore) {
  const libraries = await store.listLibraries();
  if (libraries.length > 0) {
    return libraries;
  }
  const migrated = await store.getAppState('library_migration_done');
  if (migrated?.value === 'true') {
    return libraries;
  }
  const now = new Date().toISOString();
  const libraryRecord: LibraryRecord = {
    id: createId(),
    name: 'Default Library',
    type: 'local-manual',
    createdAt: now,
    updatedAt: now,
  };
  await store.insertLibrary(libraryRecord);
  const sourceRecord: LibrarySourceRecord = {
    id: createId(),
    libraryId: libraryRecord.id,
    kind: 'local-manual',
    pathOrUrl: '',
    metadataJson: '{}',
    createdAt: now,
  };
  await store.insertLibrarySource(sourceRecord);
  const mediaSources = await store.listMediaSources();
  for (const mediaSource of mediaSources) {
    const itemRecord: LibraryItemRecord = {
        id: createId(),
      libraryId: libraryRecord.id,
      sourceId: sourceRecord.id,
      title: mediaSource.title,
      uri: mediaSource.uri,
      kind: mediaSource.kind,
      createdAt: mediaSource.createdAt,
      updatedAt: mediaSource.updatedAt,
    };
    await store.upsertLibraryItem(itemRecord);
  }
  await store.upsertAppState({
    key: 'library_migration_done',
    value: 'true',
    updatedAt: now,
  });
  return [libraryRecord];
}
