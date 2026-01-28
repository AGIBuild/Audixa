import { describe, expect, it, vi } from 'vitest';
import { parseSubtitleContent } from '../subtitleParser';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('subtitleParser', () => {
  it('delegates parsing to tauri command', async () => {
    const content = `1
00:00:01,000 --> 00:00:03,000
Hello
你好
`;
    const parsed = [
      {
        id: 'sub-0-1000',
        time: '00:01',
        en: 'Hello',
        cn: '你好',
        startMs: 1000,
        endMs: 3000,
      },
    ];
    vi.mocked(invoke).mockResolvedValue(parsed);
    const items = await parseSubtitleContent('srt', content);
    expect(invoke).toHaveBeenCalledWith('parse_subtitle_content', {
      format: 'srt',
      content,
    });
    expect(items).toEqual(parsed);
  });
});
