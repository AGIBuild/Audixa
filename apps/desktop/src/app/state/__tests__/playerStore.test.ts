import { describe, expect, it } from 'vitest';
import { getProgressPercent } from '../playerStore';

describe('player store progress', () => {
  it('returns 0 when duration is missing', () => {
    expect(getProgressPercent(10, 0)).toBe(0);
  });

  it('calculates progress from current time and duration', () => {
    expect(getProgressPercent(5, 10)).toBe(50);
  });
});
