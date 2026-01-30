const audioExtensions = new Set(['mp3', 'aac', 'm4a', 'wav', 'flac', 'ogg']);
const videoExtensions = new Set([
  'mp4',
  'mkv',
  'mov',
  'avi',
  'webm',
  'm4v',
  'm4p',
  'ts',
  'm2ts',
  'mpeg',
  'mpg',
  'mpe',
  'mxf',
  'flv',
  'wmv',
]);

export function createId() {
  return crypto.randomUUID();
}

export function canonicalizeWord(value: string) {
  return value.trim().toLowerCase();
}

export function extractFirstWord(value: string) {
  const match = value.match(/[A-Za-z][A-Za-z']*/);
  return match ? match[0] : '';
}

export function getFileName(path: string) {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  return segments[segments.length - 1] ?? path;
}

export function getFileStem(fileName: string) {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return fileName;
  }
  return fileName.slice(0, lastDot);
}

export function getParentPath(path: string) {
  const normalized = path.replace(/\\/g, '/');
  const segments = normalized.split('/');
  if (segments.length <= 1) {
    return '';
  }
  return segments.slice(0, -1).join('/');
}

export function inferMediaKind(path: string) {
  const fileName = getFileName(path);
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (audioExtensions.has(extension)) {
    return 'audio';
  }
  if (videoExtensions.has(extension)) {
    return 'video';
  }
  return 'unknown';
}

export function isSupportedMediaPath(path: string) {
  return inferMediaKind(path) !== 'unknown';
}

export function formatDurationMs(durationMs: number) {
  const clamped = Math.max(0, durationMs);
  const totalSeconds = Math.round(clamped / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Extract a search query from a media file name.
 * Extracts title and episode number only, removing all other noise.
 *
 * Examples:
 * - "Movie.Name.2023.1080p.BluRay.x264.mkv" → "Movie Name"
 * - "TV.Show.S01E05.Episode.Title.720p.mkv" → "TV Show S01E05"
 * - "剧集名.S02E10.中英字幕.mkv" → "剧集名 S02E10"
 */
export function extractSearchQuery(fileName: string): string {
  const stem = getFileStem(fileName);

  // Replace common separators with spaces
  let normalized = stem.replace(/[._]/g, ' ');

  // Remove content in brackets (usually release info)
  normalized = normalized.replace(/\[([^\]]+)\]/g, ' ');
  normalized = normalized.replace(/\{([^}]+)\}/g, ' ');
  normalized = normalized.replace(/【([^】]+)】/g, ' ');
  normalized = normalized.replace(/\(([^)]+)\)/g, ' ');

  // Extract episode marker if present (S01E05, EP01, 第01集, E01, etc.)
  const episodePatterns = [
    /\b(S\d{1,2}E\d{1,2})\b/i,           // S01E05
    /\b(S\d{1,2}\s*EP?\d{1,3})\b/i,      // S01EP05, S01 E05
    /\b(EP?\s*\d{1,3})\b/i,              // EP05, E05
    /\b(第\s*\d+\s*[集话話期回])\b/,      // 第05集, 第5话
    /\b(\d{1,3})\s*[集话話期回]\b/,       // 05集, 5话
  ];

  let episodeMarker = '';
  for (const pattern of episodePatterns) {
    const match = normalized.match(pattern);
    if (match) {
      episodeMarker = match[1].replace(/\s+/g, '');
      break;
    }
  }

  // Find where the title ends (before year, quality tags, or episode marker)
  const stopPatterns = [
    /\b(19|20)\d{2}\b/,                  // Year like 2023, 1999
    /\b(720p|1080p|2160p|4k|uhd|hd)\b/i, // Resolution
    /\b(bluray|webrip|web-dl|hdtv|dvdrip|bdrip)\b/i, // Source
    /\b(x264|x265|hevc|avc|xvid)\b/i,    // Codec
    /\b(aac|ac3|dts|flac)\b/i,           // Audio
    /\b(chs|cht|eng|简体|繁体|中英|双语|字幕)\b/i, // Language tags
  ];

  // If episode marker found, extract title before it
  let title = normalized;
  if (episodeMarker) {
    const episodeMatch = normalized.match(new RegExp(episodeMarker.replace(/([.*+?^${}()|[\]\\])/g, '\\$1'), 'i'));
    if (episodeMatch && episodeMatch.index !== undefined) {
      title = normalized.slice(0, episodeMatch.index);
    }
  }

  // Find earliest stop point
  let stopIndex = title.length;
  for (const pattern of stopPatterns) {
    const match = title.match(pattern);
    if (match && match.index !== undefined && match.index < stopIndex) {
      stopIndex = match.index;
    }
  }
  title = title.slice(0, stopIndex);

  // Clean up the title
  title = title.replace(/\s+/g, ' ').trim();
  title = title.replace(/[-–—_.,:;!?@#]+$/, '').trim();
  title = title.replace(/^[-–—_.,:;!?@#]+/, '').trim();

  // Combine title and episode marker
  if (episodeMarker && title) {
    return `${title} ${episodeMarker}`;
  }

  return title || stem.replace(/[._]/g, ' ').trim();
}
