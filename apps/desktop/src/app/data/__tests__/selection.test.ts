import { describe, expect, it } from 'vitest';
import { normalizeSelectionText } from '../selection';

describe('selection normalization', () => {
  it('extracts the first word from selection', () => {
    expect(normalizeSelectionText('  "Hello," she said.')).toBe('Hello');
    expect(normalizeSelectionText("don't stop believing")).toBe("don't");
  });

  it('returns empty string when no word is found', () => {
    expect(normalizeSelectionText('1234 !!!')).toBe('');
    expect(normalizeSelectionText('')).toBe('');
  });
});
