export type MediaKind = 'audio' | 'video' | 'unknown';

export type LibraryType = 'local-manual' | 'webdav' | 'cloud-drive';

export type Library = {
  id: string;
  name: string;
  type: LibraryType;
  createdAt: string;
  updatedAt: string;
};

export type LibrarySource = {
  id: string;
  libraryId: string;
  kind: LibraryType;
  pathOrUrl: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type LibraryItem = {
  id: string;
  libraryId: string;
  sourceId: string;
  title: string;
  uri: string;
  kind: MediaKind;
  createdAt: string;
  updatedAt: string;
};

export type SourceItem = {
  id: string;
  title: string;
  subtitle: string;
  uri: string;
  kind: MediaKind;
  createdAt: string;
  updatedAt: string;
};

export type RecentItem = {
  id: string;
  mediaSourceId: string;
  title: string;
  location: string;
  uri: string;
  libraryName: string | null;
  progress: number;
  lastPlayedAt: string;
  isValid: boolean;
};

export type SubtitleItem = {
  id: string;
  time: string;
  en: string;
  cn: string;
  startMs: number;
  endMs: number;
};

export type ListeningItem = {
  id: string;
  mediaSourceId: string;
  title: string;
  source: string;
  tags: string[];
  duration: string;
  progress: number;
  isFavorite: boolean;
  sentenceId: string;
  startMs: number;
  endMs: number;
  createdAt: string;
};

export type VocabItem = {
  id: string;
  word: string;
  pronunciation: string | null;
  isFavorite: boolean;
  isMastered: boolean;
  definition: string;
  example: string;
  source: string;
  canonicalWord: string;
  locale: string;
  createdAt: string;
  lastSeenAt: string;
};
