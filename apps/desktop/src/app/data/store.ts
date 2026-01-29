export type MediaSourceRecord = {
  id: string;
  title: string;
  uri: string;
  kind: string;
  createdAt: string;
  updatedAt: string;
};

export type RecentPlaybackRecord = {
  id: string;
  mediaSourceId: string;
  progress: number;
  lastPlayedAt: string;
};

export type SubtitleTrackRecord = {
  id: string;
  mediaSourceId: string;
  language: string;
  uri: string;
  createdAt: string;
};

export type ListeningItemRecord = {
  id: string;
  mediaSourceId: string;
  sentenceId: string;
  sentenceText: string;
  startMs: number;
  endMs: number;
  createdAt: string;
  titleOverride?: string | null;
  isFavorite?: number;
};

export type VocabItemRecord = {
  id: string;
  word: string;
  canonicalWord: string;
  locale: string;
  definition: string;
  example: string;
  source: string;
  pronunciation: string | null;
  isFavorite: number;
  isMastered: number;
  createdAt: string;
  lastSeenAt: string;
};

export type LibraryRecord = {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

export type LibrarySourceRecord = {
  id: string;
  libraryId: string;
  kind: string;
  pathOrUrl: string;
  metadataJson: string;
  createdAt: string;
};

export type LibraryItemRecord = {
  id: string;
  libraryId: string;
  sourceId: string;
  title: string;
  uri: string;
  kind: string;
  createdAt: string;
  updatedAt: string;
};

export type LibraryCredentialRecord = {
  id: string;
  libraryId: string;
  keyringKey: string;
  createdAt: string;
};

export type AppStateRecord = {
  key: string;
  value: string;
  updatedAt: string;
};

export type DesktopDataStore = {
  listMediaSources: () => Promise<MediaSourceRecord[]>;
  findMediaSourceByUri: (uri: string) => Promise<MediaSourceRecord | null>;
  insertMediaSource: (record: MediaSourceRecord) => Promise<void>;
  updateMediaSource: (record: MediaSourceRecord) => Promise<void>;
  listRecentPlaybacks: () => Promise<RecentPlaybackRecord[]>;
  upsertRecentPlayback: (record: RecentPlaybackRecord) => Promise<void>;
  deleteRecentPlayback: (id: string) => Promise<void>;
  listSubtitleTracks: (mediaSourceId: string) => Promise<SubtitleTrackRecord[]>;
  insertSubtitleTrack: (record: SubtitleTrackRecord) => Promise<void>;
  listListeningItems: () => Promise<ListeningItemRecord[]>;
  insertListeningItem: (record: ListeningItemRecord) => Promise<void>;
  updateListeningItemTitle: (id: string, title: string | null) => Promise<void>;
  updateListeningItemFavorite: (id: string, isFavorite: number) => Promise<void>;
  deleteListeningItem: (id: string) => Promise<void>;
  listVocabItems: () => Promise<VocabItemRecord[]>;
  upsertVocabItem: (record: VocabItemRecord) => Promise<void>;
  updateVocabItem: (record: VocabItemRecord) => Promise<void>;
  deleteVocabItem: (id: string) => Promise<void>;
  listLibraries: () => Promise<LibraryRecord[]>;
  insertLibrary: (record: LibraryRecord) => Promise<void>;
  updateLibraryTimestamp: (libraryId: string, updatedAt: string) => Promise<void>;
  listLibrarySources: (libraryId: string) => Promise<LibrarySourceRecord[]>;
  insertLibrarySource: (record: LibrarySourceRecord) => Promise<void>;
  listLibraryItems: (libraryId: string) => Promise<LibraryItemRecord[]>;
  upsertLibraryItem: (record: LibraryItemRecord) => Promise<void>;
  updateLibraryItem: (record: LibraryItemRecord) => Promise<void>;
  deleteLibraryItemByUri: (libraryId: string, uri: string) => Promise<void>;
  deleteLibraryItem: (id: string) => Promise<void>;
  listLibraryCredentials: (libraryId: string) => Promise<LibraryCredentialRecord[]>;
  upsertLibraryCredential: (record: LibraryCredentialRecord) => Promise<void>;
  deleteLibraryItemsByLibraryId: (libraryId: string) => Promise<void>;
  deleteLibrarySourcesByLibraryId: (libraryId: string) => Promise<void>;
  deleteLibraryCredentialsByLibraryId: (libraryId: string) => Promise<void>;
  deleteLibrary: (libraryId: string) => Promise<void>;
  getAppState: (key: string) => Promise<AppStateRecord | null>;
  upsertAppState: (record: AppStateRecord) => Promise<void>;
};
