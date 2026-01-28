import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';

const OPEN_SUBTITLES_BASE = 'https://api.opensubtitles.com/api/v1';

export type OpenSubtitleResult = {
  id: string;
  fileId: number;
  language: string;
  format: string;
  fileName: string;
  release: string;
  downloads: number;
};

export async function searchOpenSubtitles(
  query: string,
  apiKey: string,
  language = 'en',
): Promise<OpenSubtitleResult[]> {
  const params = new URLSearchParams();
  params.set('query', query);
  params.set('languages', language);
  const response = await fetch(`${OPEN_SUBTITLES_BASE}/subtitles?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Api-Key': apiKey,
    },
  });
  if (!response.ok) {
    throw new Error(`OpenSubtitles search failed (${response.status}).`);
  }
  const payload = (await response.json()) as {
    data?: Array<{
      id?: string | number;
      attributes?: {
        language?: string;
        release?: string;
        download_count?: number;
        files?: Array<{ file_id?: number; file_name?: string }>;
        format?: string;
      };
    }>;
  };
  return (payload.data ?? [])
    .map((item) => {
      const attributes = item.attributes ?? {};
      const file = attributes.files?.[0];
      const fileName = file?.file_name ?? 'subtitle.srt';
      return {
        id: String(item.id ?? file?.file_id ?? ''),
        fileId: Number(file?.file_id ?? 0),
        language: String(attributes.language ?? language),
        format: String(attributes.format ?? inferSubtitleFormat(fileName)),
        fileName,
        release: String(attributes.release ?? ''),
        downloads: Number(attributes.download_count ?? 0),
      };
    })
    .filter((item) => item.fileId);
}

export async function downloadOpenSubtitle(
  fileId: number,
  apiKey: string,
): Promise<{ path: string; fileName: string }> {
  const response = await fetch(`${OPEN_SUBTITLES_BASE}/download`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_id: fileId,
      sub_format: 'srt',
      remove_adds: true,
      cleanup_links: true,
      strip_html: true,
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenSubtitles download failed (${response.status}).`);
  }
  const payload = (await response.json()) as { link?: string; file_name?: string };
  if (!payload.link) {
    throw new Error('OpenSubtitles download link missing.');
  }
  const fileResponse = await fetch(payload.link, { method: 'GET' });
  if (!fileResponse.ok) {
    throw new Error(`Subtitle fetch failed (${fileResponse.status}).`);
  }
  const buffer = await fileResponse.arrayBuffer();
  const cacheDir = await getOpenSubtitlesCacheDir();
  const fileName = sanitizeFileName(payload.file_name ?? `opensubtitles-${fileId}.srt`);
  const targetPath = await join(cacheDir, fileName);
  await writeFile(targetPath, new Uint8Array(buffer));
  return { path: targetPath, fileName };
}

function inferSubtitleFormat(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'vtt' || ext === 'ass') {
    return ext;
  }
  return 'srt';
}

async function getOpenSubtitlesCacheDir() {
  const base = await appDataDir();
  const dir = await join(base, 'subtitles', 'opensubtitles');
  await mkdir(dir, { recursive: true });
  return dir;
}

function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}
