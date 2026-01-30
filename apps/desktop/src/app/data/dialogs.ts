import { open } from '@tauri-apps/plugin-dialog';

async function pickSingleFile(options: Parameters<typeof open>[0]) {
  const result = await open({ multiple: false, ...options });
  if (!result) {
    return null;
  }
  if (Array.isArray(result)) {
    return result[0] ?? null;
  }
  return result;
}

async function pickMultipleFiles(options: Parameters<typeof open>[0]) {
  const result = await open({ multiple: true, ...options });
  if (!result) {
    return [];
  }
  if (Array.isArray(result)) {
    return result;
  }
  return [result];
}

export async function pickMediaFiles() {
  return pickMultipleFiles({
    title: 'Import media',
    filters: [
      {
        name: 'Media files',
        extensions: ['mp3', 'aac', 'm4a', 'wav', 'flac', 'ogg', 'mp4', 'mkv', 'mov', 'avi', 'webm'],
      },
    ],
  });
}

export async function pickSubtitleFile() {
  return pickSingleFile({
    title: 'Attach subtitles',
    filters: [
      {
        name: 'Subtitle files',
        extensions: ['srt', 'vtt', 'ass', 'lrc'],
      },
    ],
  });
}
