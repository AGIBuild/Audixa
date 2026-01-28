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
