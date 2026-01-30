import { invoke } from '@tauri-apps/api/core';
import type { SubtitleItem } from './types';
import { createId, formatDurationMs } from './utils';

export type SubtitleFormat = 'srt' | 'vtt' | 'ass' | 'lrc';

export async function parseSubtitleContent(
  format: SubtitleFormat,
  content: string,
): Promise<SubtitleItem[]> {
  if (format === 'lrc') {
    return parseLrcContent(content);
  }
  return invoke<SubtitleItem[]>('parse_subtitle_content', { format, content });
}

function parseLrcContent(content: string): SubtitleItem[] {
  const timeTag = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;
  const rows: Array<{ startMs: number; text: string }> = [];

  for (const line of content.split(/\r?\n/)) {
    timeTag.lastIndex = 0;
    const matches = Array.from(line.matchAll(timeTag));
    if (matches.length === 0) {
      continue;
    }
    const text = line.replace(timeTag, '').trim();
    if (!text) {
      continue;
    }
    for (const match of matches) {
      const minutes = Number(match[1] ?? 0);
      const seconds = Number(match[2] ?? 0);
      const fraction = match[3] ?? '0';
      const ms =
        fraction.length === 1
          ? Number(fraction) * 100
          : fraction.length === 2
            ? Number(fraction) * 10
            : Number(fraction);
      const startMs = Math.max(0, (minutes * 60 + seconds) * 1000 + ms);
      rows.push({ startMs, text });
    }
  }

  rows.sort((a, b) => a.startMs - b.startMs);
  return rows.map((row, index) => {
    const nextStart = rows[index + 1]?.startMs;
    const fallbackEnd = row.startMs + 4000;
    const endMs = nextStart
      ? Math.max(row.startMs + 500, nextStart - 10)
      : fallbackEnd;
    return {
      id: createId(),
      time: formatDurationMs(row.startMs),
      en: row.text,
      cn: '',
      startMs: row.startMs,
      endMs,
    };
  });
}
