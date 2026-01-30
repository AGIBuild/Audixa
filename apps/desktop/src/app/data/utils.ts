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
 * Cleans up common release tags, resolution markers, and codec info.
 */
export function extractSearchQuery(fileName: string): string {
  const stem = getFileStem(fileName);

  // Replace common separators with spaces
  let cleaned = stem.replace(/[._]/g, ' ');

  // Remove common release/quality tags
  const patterns = [
    // Resolution patterns
    /\b(720p|1080p|2160p|4k|uhd|hd|sd)\b/gi,
    // Codec patterns
    /\b(x264|x265|h\.?264|h\.?265|hevc|avc|xvid|divx)\b/gi,
    // Audio codec patterns
    /\b(aac|ac3|dts|flac|mp3|eac3|atmos|truehd)\b/gi,
    // Source patterns
    /\b(bluray|bdrip|brrip|webrip|web-dl|webdl|hdtv|dvdrip|hdrip|hdcam|cam|ts|tc)\b/gi,
    // Release group patterns (in brackets or after dash at end)
    /\[([^\]]+)\]/g,
    /\{([^}]+)\}/g,
    /-\s*[a-z0-9]+$/i,
    // HDR patterns
    /\b(hdr|hdr10|dolby\s*vision|dv)\b/gi,
    // Year in parentheses or brackets (keep if looks like a year)
    /\((\d{4})\)/g,
    // Extra whitespace and trailing/leading punctuation
  ];

  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Collapse multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove trailing punctuation
  cleaned = cleaned.replace(/[-–—_.,:;!?]+$/, '').trim();

  return cleaned;
}
