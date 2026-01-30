import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, readDir, readFile, writeFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import type { LibraryItem, LibraryType, MediaKind, SubtitleItem } from './types';
import { getFileName, getFileStem, getParentPath } from './utils';
import { parseSubtitleContent } from './subtitleParser';
import { getDesktopRepository } from './repository';
import { readWebDavPassword } from './keyring';
import type { BurnedSubtitleRegion, SubtitleTrack } from '../state/subtitleStore';

type SubtitleLoadResult = {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  items: SubtitleItem[];
};

type SubtitleSourceContext = {
  uri: string;
  kind: MediaKind;
  libraryId: string | null;
  libraryType: LibraryType | null;
  libraryItems: LibraryItem[];
};

const externalExtensions: SubtitleTrack['format'][] = ['srt', 'vtt', 'ass', 'lrc'];

type BurnedSubtitleDetection = {
  region: BurnedSubtitleRegion | null;
  error?: string;
};

export async function loadSubtitlesForSource(
  context: SubtitleSourceContext,
  preferredTrackId?: string | null,
): Promise<SubtitleLoadResult> {
  if (!context.uri) {
    return { tracks: [], activeTrackId: null, items: [] };
  }

  // Only external subtitles are supported (no embedded subtitle extraction).
  const externalTrack = await discoverExternalTrack(context);
  const tracks = externalTrack ? [externalTrack] : [];

  if (preferredTrackId === 'off') {
    return { tracks, activeTrackId: null, items: [] };
  }

  const activeTrackId =
    preferredTrackId && tracks.some((track) => track.id === preferredTrackId)
      ? preferredTrackId
      : tracks[0]?.id ?? null;

  if (!activeTrackId) {
    return { tracks, activeTrackId: null, items: [] };
  }

  const activeTrack = tracks.find((track) => track.id === activeTrackId);
  const items = activeTrack ? await loadSubtitleTrack(activeTrack, context) : [];
  return { tracks, activeTrackId, items };
}

export async function loadSubtitleTrack(
  track: SubtitleTrack,
  context: SubtitleSourceContext,
): Promise<SubtitleItem[]> {
  // Only external subtitles are supported.
  if (track.kind !== 'external') {
    return [];
  }
  return loadExternalSubtitle(track, context);
}

export async function detectBurnedSubtitleRegion(
  _context: SubtitleSourceContext,
): Promise<BurnedSubtitleDetection> {
  // Burned-in subtitle detection is disabled (requires FFmpeg).
  return { region: null };
}

async function discoverExternalTrack(
  context: SubtitleSourceContext,
): Promise<SubtitleTrack | null> {
  if (context.libraryType === 'webdav') {
    const matched = findExternalInLibrary(context);
    const remoteMatch = matched ?? (await findExternalWebDav(context));
    if (!remoteMatch) {
      return null;
    }
    const fileName = getFileName(remoteMatch.uri);
    return {
      id: `external-${remoteMatch.uri}`,
      kind: 'external',
      format: remoteMatch.format,
      label: `${fileName} (${remoteMatch.format})`,
      source: remoteMatch.uri,
    };
  }

  const matched = await findExternalLocal(context.uri);
  if (!matched) {
    return null;
  }
  const fileName = getFileName(matched.path);
  return {
    id: `external-${matched.path}`,
    kind: 'external',
    format: matched.format,
    label: `${fileName} (${matched.format})`,
    source: matched.path,
  };
}

async function loadExternalSubtitle(
  track: SubtitleTrack,
  context: SubtitleSourceContext,
): Promise<SubtitleItem[]> {
  try {
    if (context.libraryType === 'webdav') {
      const content = await downloadWebDavSubtitle(track.source, context);
      return parseSubtitleContent(track.format, content);
    }
    const content = await readSubtitleTextFromFile(track.source);
    return parseSubtitleContent(track.format, content);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : error ? String(error) : 'External subtitle load failed.';
    throw new Error(message || 'External subtitle load failed.');
  }
}

async function findExternalLocal(uri: string) {
  const parent = getParentPath(uri);
  const rawStem = getFileStem(getFileName(uri));
  const stem = rawStem.toLowerCase();
  try {
    const entries = await readDir(parent, { recursive: false });
    const candidates = entries
      .filter((entry) => entry.path && !entry.children)
      .map((entry) => ({
        name: entry.name ?? getFileName(entry.path ?? ''),
        path: entry.path ?? '',
      }))
      .filter((entry) => entry.name && entry.path)
      .map((entry) => ({
        name: entry.name,
        path: entry.path,
        ext: entry.name.split('.').pop()?.toLowerCase() ?? '',
        stem: getFileStem(entry.name).toLowerCase(),
      }))
      .filter((entry) => externalExtensions.includes(entry.ext as SubtitleTrack['format']))
      .map((entry) => ({
        path: entry.path,
        format: entry.ext as SubtitleTrack['format'],
        stem: entry.stem,
      }));

    const exact = candidates.find((entry) => entry.stem === stem);
    if (exact) {
      return { path: exact.path, format: exact.format };
    }
    const languageMatch = candidates.find((entry) => entry.stem.startsWith(`${stem}.`));
    if (languageMatch) {
      return { path: languageMatch.path, format: languageMatch.format };
    }
  } catch {
    // Fallback to strict same-name lookup.
  }

  for (const format of externalExtensions) {
    const candidate = await join(parent, `${rawStem}.${format}`);
    try {
      await readFile(candidate);
      return { path: candidate, format };
    } catch {
      continue;
    }
  }
  return null;
}

function findExternalInLibrary(context: SubtitleSourceContext) {
  const stem = getFileStem(getFileName(context.uri));
  for (const item of context.libraryItems) {
    const itemStem = getFileStem(getFileName(item.uri));
    if (itemStem !== stem) {
      continue;
    }
    const ext = getFileName(item.uri).split('.').pop()?.toLowerCase();
    if (ext && externalExtensions.includes(ext as SubtitleTrack['format'])) {
      return { uri: item.uri, format: ext as SubtitleTrack['format'] };
    }
  }
  return null;
}

async function findExternalWebDav(context: SubtitleSourceContext) {
  const authHeader = await getWebDavAuthHeader(context);
  if (!authHeader) {
    return null;
  }
  const baseName = getFileName(context.uri);
  const stem = getFileStem(baseName);
  for (const format of externalExtensions) {
    const candidateName = `${stem}.${format}`;
    const candidateUrl = new URL(context.uri);
    candidateUrl.pathname = candidateUrl.pathname.replace(/[^/]+$/, candidateName);
    const candidate = candidateUrl.toString();
    const response = await fetch(candidate, {
      method: 'HEAD',
      headers: {
        Authorization: authHeader.replace('Authorization: ', ''),
      },
    });
    if (response.ok) {
      return { uri: candidate, format };
    }
  }
  return null;
}

async function downloadWebDavSubtitle(
  uri: string,
  context: SubtitleSourceContext,
) {
  const authHeader = await getWebDavAuthHeader(context);
  if (!authHeader) {
    throw new Error('WebDAV credentials missing.');
  }
  const response = await fetch(uri, {
    headers: {
      Authorization: authHeader.replace('Authorization: ', ''),
    },
  });
  if (!response.ok) {
    throw new Error(`Subtitle download failed (${response.status}).`);
  }
  const buffer = await response.arrayBuffer();
  const cacheDir = await getSubtitleCacheDir();
  const fileName = getFileName(uri);
  const cachePath = await join(cacheDir, `webdav-${Date.now()}-${fileName}`);
  await writeFile(cachePath, new Uint8Array(buffer));
  return decodeSubtitleBuffer(new Uint8Array(buffer));
}

async function getWebDavAuthHeader(context: SubtitleSourceContext) {
  if (context.libraryType !== 'webdav' || !context.libraryId) {
    return null;
  }
  const repo = await getDesktopRepository();
  const sources = await repo.listLibrarySources(context.libraryId);
  const metadata = sources[0]?.metadata ?? {};
  const username = String(metadata.username ?? '');
  if (!username) {
    return null;
  }
  const keyringKey = await repo.getLibraryCredential(context.libraryId);
  if (!keyringKey) {
    return null;
  }
  const password = await readWebDavPassword(keyringKey);
  const encoded = btoa(`${username}:${password}`);
  return `Authorization: Basic ${encoded}\r\n`;
}

async function getSubtitleCacheDir() {
  const base = await appDataDir();
  const dir = await join(base, 'subtitles');
  await mkdir(dir, { recursive: true });
  return dir;
}

async function readSubtitleTextFromFile(path: string) {
  const buffer = await readFile(path);
  return decodeSubtitleBuffer(new Uint8Array(buffer));
}

function decodeSubtitleBuffer(buffer: Uint8Array) {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer.slice(3));
  }
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(buffer.slice(2));
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    try {
      return new TextDecoder('utf-16be').decode(buffer.slice(2));
    } catch {
      return new TextDecoder('utf-16le').decode(buffer.slice(2));
    }
  }
  if (isValidUtf8(buffer)) {
    return new TextDecoder('utf-8').decode(buffer);
  }
  return decodeWithFallback(buffer);
}

function decodeWithFallback(buffer: Uint8Array) {
  try {
    return new TextDecoder('gb18030').decode(buffer);
  } catch {
    try {
      return new TextDecoder('gbk').decode(buffer);
    } catch {
      return new TextDecoder('utf-8').decode(buffer);
    }
  }
}

function isValidUtf8(buffer: Uint8Array) {
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i] ?? 0;
    if (byte <= 0x7f) {
      continue;
    }
    if (byte >= 0xc2 && byte <= 0xdf) {
      if (i + 1 >= buffer.length || (buffer[i + 1] & 0xc0) !== 0x80) {
        return false;
      }
      i += 1;
      continue;
    }
    if (byte >= 0xe0 && byte <= 0xef) {
      if (
        i + 2 >= buffer.length ||
        (buffer[i + 1] & 0xc0) !== 0x80 ||
        (buffer[i + 2] & 0xc0) !== 0x80
      ) {
        return false;
      }
      if (byte === 0xe0 && (buffer[i + 1] ?? 0) < 0xa0) {
        return false;
      }
      if (byte === 0xed && (buffer[i + 1] ?? 0) >= 0xa0) {
        return false;
      }
      i += 2;
      continue;
    }
    if (byte >= 0xf0 && byte <= 0xf4) {
      if (
        i + 3 >= buffer.length ||
        (buffer[i + 1] & 0xc0) !== 0x80 ||
        (buffer[i + 2] & 0xc0) !== 0x80 ||
        (buffer[i + 3] & 0xc0) !== 0x80
      ) {
        return false;
      }
      if (byte === 0xf0 && (buffer[i + 1] ?? 0) < 0x90) {
        return false;
      }
      if (byte === 0xf4 && (buffer[i + 1] ?? 0) > 0x8f) {
        return false;
      }
      i += 3;
      continue;
    }
    return false;
  }
  return true;
}
