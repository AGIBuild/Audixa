import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, readDir, readFile, remove, readTextFile, writeFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import type { LibraryItem, LibraryType, MediaKind, SubtitleItem } from './types';
import { getFileName, getFileStem, getParentPath } from './utils';
import { ensureFfmpeg } from './ffmpegManager';
import { runFfprobe, runFfmpeg } from './ffmpegRunner';
import { parseSubtitleContent } from './subtitleParser';
import { getDesktopRepository } from './repository';
import { readWebDavPassword } from './keyring';
import type { BurnedSubtitleRegion, SubtitleTrack } from '../state/subtitleStore';
import { createWorker } from 'tesseract.js';

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

type EmbeddedDiscoveryResult = {
  tracks: SubtitleTrack[];
  error?: string;
};

const externalExtensions: SubtitleTrack['format'][] = ['srt', 'vtt', 'ass', 'lrc'];
const burnedFrameCount = 5;
const burnedFrameRate = 1;
const burnedScaleWidth = 640;

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

  const { tracks: embeddedTracks, error: embeddedError } =
    context.kind !== 'audio'
      ? await discoverEmbeddedTracks(context)
      : { tracks: [], error: undefined };
  const externalTrack = await discoverExternalTrack(context);
  if (embeddedError) {
    console.warn('[subtitle] embedded discovery failed:', embeddedError);
  }

  const tracks = [
    ...embeddedTracks,
    ...(externalTrack ? [externalTrack] : []),
  ];
  if (preferredTrackId === 'off') {
    return { tracks, activeTrackId: null, items: [] };
  }
  const activeTrackId =
    preferredTrackId && tracks.some((track) => track.id === preferredTrackId)
      ? preferredTrackId
      : tracks[0]?.id ?? null;

  if (!activeTrackId) {
    if (embeddedError) {
      throw new Error(embeddedError);
    }
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
  if (track.kind === 'embedded') {
    return extractEmbeddedSubtitle(track, context);
  }
  return loadExternalSubtitle(track, context);
}

export async function detectBurnedSubtitleRegion(
  context: SubtitleSourceContext,
): Promise<BurnedSubtitleDetection> {
  if (context.kind === 'audio') {
    return { region: null };
  }
  try {
    const { ffmpegPath } = await ensureFfmpeg();
    const authHeader = await getWebDavAuthHeader(context);
    const cacheDir = await getSubtitleCacheDir();
    const detectDir = await join(cacheDir, `burned-${Date.now()}`);
    await mkdir(detectDir, { recursive: true });
    const outputPattern = await join(detectDir, 'frame-%02d.png');
    const args = ['-y', '-v', 'error'];
    if (authHeader) {
      args.push('-headers', authHeader);
    }
    args.push(
      '-i',
      context.uri,
      '-vf',
      `fps=${burnedFrameRate},scale=${burnedScaleWidth}:-1`,
      '-frames:v',
      String(burnedFrameCount),
      outputPattern,
    );
    const result = await runFfmpeg(ffmpegPath, args);
    if (result.code !== 0) {
      return {
        region: null,
        error: `FFmpeg frame sampling failed (code ${result.code}).`,
      };
    }
    const entries = await readDir(detectDir);
    const framePaths = entries
      .filter((entry) => entry.path?.endsWith('.png'))
      .map((entry) => entry.path!)
      .sort();
    if (framePaths.length === 0) {
      return { region: null, error: 'No frames generated for OCR.' };
    }

    const worker = await createWorker();
    const ocrLanguages = await getOcrLanguages();
    if ('load' in worker) {
      await worker.load();
    }
    if ('loadLanguage' in worker) {
      await worker.loadLanguage(ocrLanguages);
      await worker.initialize(ocrLanguages);
    }

    const regions: BurnedSubtitleRegion[] = [];
    for (const framePath of framePaths) {
      const buffer = await readFile(framePath);
      const blob = new Blob([buffer], { type: 'image/png' });
      // eslint-disable-next-line no-await-in-loop
      const result = await worker.recognize(blob);
      const data = result.data as {
        words?: Array<{
          text?: string;
          confidence?: number;
          bbox?: { x0: number; y0: number; x1: number; y1: number };
        }>;
        imageWidth?: number;
        imageHeight?: number;
      };
      const { region } = extractBurnedRegion(data);
      if (region) {
        regions.push(region);
      }
    }

    if ('terminate' in worker) {
      await worker.terminate();
    }

    for (const framePath of framePaths) {
      try {
        // Best-effort cleanup.
        await remove(framePath);
      } catch {
        // Ignore cleanup errors.
      }
    }

    const merged = mergeStableRegion(regions);
    return { region: merged };
  } catch (error) {
    return {
      region: null,
      error:
        error instanceof Error && error.message
          ? error.message
          : 'Burned-in subtitle detection failed.',
    };
  }
}

async function discoverEmbeddedTracks(
  context: SubtitleSourceContext,
): Promise<EmbeddedDiscoveryResult> {
  try {
    const { ffprobePath } = await ensureFfmpeg();
    const authHeader = await getWebDavAuthHeader(context);
    const args = [
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_streams',
      '-select_streams',
      's',
    ];
    if (authHeader) {
      args.push('-headers', authHeader);
    }
    args.push(context.uri);
    const result = await runFfprobe(ffprobePath, args);
    if (result.code !== 0) {
      return {
        tracks: [],
        error: `FFprobe failed (code ${result.code}): ${
          result.stderr?.trim() || result.stdout?.trim() || 'Unknown error.'
        }`,
      };
    }

    let data: { streams?: Array<Record<string, unknown>> } = {};
    try {
      data = JSON.parse(result.stdout.trim()) as {
        streams?: Array<Record<string, unknown>>;
      };
    } catch {
      return {
        tracks: [],
        error: `FFprobe output parse failed: ${result.stdout.slice(0, 200)}`,
      };
    }

    const streams = data.streams ?? [];
    const tracks: SubtitleTrack[] = [];
    for (const stream of streams) {
      const codec = String(stream.codec_name ?? '');
      if (!isTextSubtitleCodec(codec)) {
        continue;
      }
      const language = getStreamLanguage(stream);
      const index = Number(stream.index ?? -1);
      if (!Number.isFinite(index) || index < 0) {
        continue;
      }
      tracks.push({
        id: `embedded-${index}`,
        kind: 'embedded',
        format: 'srt',
        label: `Track ${index + 1} · ${language ?? 'Unknown'} (${codec})`,
        language,
        source: context.uri,
        streamIndex: index,
      });
    }

    return { tracks };
  } catch (error) {
    return {
      tracks: [],
      error:
        error instanceof Error && error.message
          ? error.message
          : 'FFprobe execution failed.',
    };
  }
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

async function extractEmbeddedSubtitle(
  track: SubtitleTrack,
  context: SubtitleSourceContext,
): Promise<SubtitleItem[]> {
  if (track.streamIndex === undefined) {
    return [];
  }
  const { ffmpegPath } = await ensureFfmpeg();
  const authHeader = await getWebDavAuthHeader(context);
  const cacheDir = await getSubtitleCacheDir();
  const outputPath = await join(
    cacheDir,
    `embedded-${track.streamIndex}-${Date.now()}.srt`,
  );
  const args = ['-y', '-v', 'error'];
  if (authHeader) {
    args.push('-headers', authHeader);
  }
  args.push(
    '-i',
    context.uri,
    '-map',
    `0:${track.streamIndex}`,
    '-c:s',
    'srt',
    outputPath,
  );
  const result = await runFfmpeg(ffmpegPath, args);
  if (result.code !== 0) {
    return [];
  }
  const content = await readSubtitleTextFromFile(outputPath);
  return parseSubtitleContent('srt', content);
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

function isTextSubtitleCodec(codec: string) {
  return ['subrip', 'ass', 'ssa', 'webvtt', 'mov_text'].includes(codec);
}

function getStreamLanguage(stream: Record<string, unknown>) {
  const tags = stream.tags as Record<string, string> | undefined;
  return tags?.language;
}

async function getOcrLanguages() {
  const repo = await getDesktopRepository();
  const raw = await repo.getAppSetting('ocrLanguages');
  return normalizeOcrLanguages(raw);
}

function normalizeOcrLanguages(value: string | null) {
  const parts = (value ?? '')
    .split(/[,+\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(parts));
  return unique.length ? unique.join('+') : 'eng';
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

function extractBurnedRegion(data: {
  words?: Array<{
    text?: string;
    confidence?: number;
    bbox?: { x0: number; y0: number; x1: number; y1: number };
  }>;
  imageWidth?: number;
  imageHeight?: number;
}): { region: BurnedSubtitleRegion | null } {
  const words = (data.words ?? []).filter(
    (word) => (word.confidence ?? 0) > 60 && (word.text ?? '').trim().length > 0,
  );
  const width = data.imageWidth ?? 0;
  const height = data.imageHeight ?? 0;
  if (!width || !height || words.length < 2) {
    return { region: null };
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = 0;
  let maxY = 0;
  for (const word of words) {
    const box = word.bbox;
    if (!box) {
      continue;
    }
    minX = Math.min(minX, box.x0);
    minY = Math.min(minY, box.y0);
    maxX = Math.max(maxX, box.x1);
    maxY = Math.max(maxY, box.y1);
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY) || maxX <= minX || maxY <= minY) {
    return { region: null };
  }
  const region: BurnedSubtitleRegion = {
    x: minX / width,
    y: minY / height,
    width: (maxX - minX) / width,
    height: (maxY - minY) / height,
  };
  return { region };
}

function mergeStableRegion(regions: BurnedSubtitleRegion[]) {
  if (regions.length < 2) {
    return null;
  }
  const average = regions.reduce(
    (acc, region) => ({
      x: acc.x + region.x,
      y: acc.y + region.y,
      width: acc.width + region.width,
      height: acc.height + region.height,
    }),
    { x: 0, y: 0, width: 0, height: 0 },
  );
  const count = regions.length;
  const mean = {
    x: average.x / count,
    y: average.y / count,
    width: average.width / count,
    height: average.height / count,
  };
  const maxDeviation = regions.reduce((acc, region) => {
    const deviation = Math.max(
      Math.abs(region.x - mean.x),
      Math.abs(region.y - mean.y),
      Math.abs(region.width - mean.width),
      Math.abs(region.height - mean.height),
    );
    return Math.max(acc, deviation);
  }, 0);
  return maxDeviation > 0.08 ? null : mean;
}
