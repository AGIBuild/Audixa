import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs';
import { fetch } from '@tauri-apps/plugin-http';
import type {
  SubtitleProvider,
  SubtitleSearchOptions,
  SubtitleSearchResult,
  SubtitleDownloadResult,
} from './types';

const OPEN_SUBTITLES_BASE = 'https://api.opensubtitles.com/api/v1';

/**
 * OpenSubtitles.com subtitle provider implementation.
 */
export const openSubtitlesProvider: SubtitleProvider = {
  id: 'opensubtitles',
  name: 'OpenSubtitles',
  requiresApiKey: true,
  apiKeySettingKey: 'openSubtitlesApiKey',

  async search(options: SubtitleSearchOptions, apiKey?: string): Promise<SubtitleSearchResult[]> {
    if (!apiKey) {
      throw new Error('OpenSubtitles API key is required.');
    }

    const params = new URLSearchParams();

    if (options.query) {
      params.set('query', options.query);
    }
    if (options.moviehash) {
      params.set('moviehash', options.moviehash);
    }
    if (options.languages) {
      params.set('languages', options.languages);
    }
    if (options.type && options.type !== 'all') {
      params.set('type', options.type);
    }
    if (options.year) {
      params.set('year', String(options.year));
    }
    if (options.imdbId) {
      params.set('imdb_id', options.imdbId);
    }

    if (!options.query && !options.moviehash && !options.imdbId) {
      throw new Error('Search requires at least query, moviehash, or imdbId.');
    }

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

    const defaultLanguage = options.languages ?? 'en';
    return (payload.data ?? [])
      .map((item) => {
        const attributes = item.attributes ?? {};
        const file = attributes.files?.[0];
        const fileName = file?.file_name ?? 'subtitle.srt';
        return {
          id: String(item.id ?? file?.file_id ?? ''),
          fileId: Number(file?.file_id ?? 0),
          language: String(attributes.language ?? defaultLanguage),
          format: String(attributes.format ?? inferSubtitleFormat(fileName)),
          fileName,
          release: String(attributes.release ?? ''),
          downloads: Number(attributes.download_count ?? 0),
          providerId: 'opensubtitles',
        };
      })
      .filter((item) => item.fileId);
  },

  async download(fileId: string | number, apiKey?: string): Promise<SubtitleDownloadResult> {
    if (!apiKey) {
      throw new Error('OpenSubtitles API key is required.');
    }

    const response = await fetch(`${OPEN_SUBTITLES_BASE}/download`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: Number(fileId),
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
  },
};

function inferSubtitleFormat(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'vtt' || ext === 'ass') {
    return ext;
  }
  return 'srt';
}

async function getOpenSubtitlesCacheDir(): Promise<string> {
  const base = await appDataDir();
  const dir = await join(base, 'subtitles', 'opensubtitles');
  await mkdir(dir, { recursive: true });
  return dir;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}
