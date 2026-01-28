import { describe, expect, it } from 'vitest';
import { parseDictionaryResponse } from '../dictionaryClient';

describe('dictionary lookup parser', () => {
  it('parses definition and pronunciation', () => {
    const payload = [
      {
        word: 'hello',
        phonetic: '/həˈləʊ/',
        phonetics: [{ text: '/həˈloʊ/' }],
        meanings: [
          {
            definitions: [
              {
                definition: 'used as a greeting',
                example: 'hello world',
              },
            ],
          },
        ],
      },
    ];

    const result = parseDictionaryResponse(payload, 'fallback');

    expect(result).toEqual({
      word: 'hello',
      definition: 'used as a greeting',
      pronunciation: '/həˈloʊ/',
    });
  });

  it('falls back to the provided word when missing', () => {
    const payload = [
      {
        meanings: [
          {
            definitions: [{ definition: 'a fallback definition' }],
          },
        ],
      },
    ];

    const result = parseDictionaryResponse(payload, 'fallback');

    expect(result?.word).toBe('fallback');
  });

  it('returns null when no definition is available', () => {
    const payload = [{ word: 'empty', meanings: [] }];

    expect(parseDictionaryResponse(payload, 'empty')).toBeNull();
    expect(parseDictionaryResponse([], 'empty')).toBeNull();
  });
});
