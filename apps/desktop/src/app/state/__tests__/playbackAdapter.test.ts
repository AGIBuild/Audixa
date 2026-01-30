import { describe, expect, it, vi } from 'vitest';
import { createHtmlMediaAdapter } from '../playbackAdapter';

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));

function createMediaElement() {
  const element = document.createElement('audio') as HTMLMediaElement;
  Object.defineProperty(element, 'play', {
    value: vi.fn().mockImplementation(() => {
      element.dispatchEvent(new Event('play'));
      return Promise.resolve();
    }),
  });
  Object.defineProperty(element, 'pause', {
    value: vi.fn().mockImplementation(() => {
      element.dispatchEvent(new Event('pause'));
    }),
  });
  Object.defineProperty(element, 'load', { value: vi.fn() });
  Object.defineProperty(element, 'playbackRate', { writable: true, value: 1 });
  Object.defineProperty(element, 'currentTime', { writable: true, value: 0 });
  Object.defineProperty(element, 'duration', { writable: true, value: 0 });
  return element;
}

describe('html media adapter', () => {
  it('updates status on play and pause events', async () => {
    const adapter = createHtmlMediaAdapter();
    const element = createMediaElement();
    adapter.setElement(element);

    await adapter.load({ path: 'C:\\media\\demo.mp3', kind: 'audio' });
    await adapter.play();
    expect(adapter.getState().status).toBe('playing');

    adapter.pause();
    expect(adapter.getState().status).toBe('paused');
  });

  it('updates time and duration from events', async () => {
    const adapter = createHtmlMediaAdapter();
    const element = createMediaElement();
    adapter.setElement(element);

    await adapter.load({ path: 'C:\\media\\demo.mp3', kind: 'audio' });
    element.duration = 12;
    element.currentTime = 4;
    element.dispatchEvent(new Event('timeupdate'));

    expect(adapter.getState().duration).toBe(12);
    expect(adapter.getState().currentTime).toBe(4);
  });

  it('updates rate on ratechange events', async () => {
    const adapter = createHtmlMediaAdapter();
    const element = createMediaElement();
    adapter.setElement(element);

    await adapter.load({ path: 'C:\\media\\demo.mp3', kind: 'audio' });
    element.playbackRate = 1.5;
    element.dispatchEvent(new Event('ratechange'));

    expect(adapter.getState().rate).toBe(1.5);
  });

  it('surfaces media errors', async () => {
    const adapter = createHtmlMediaAdapter();
    const element = createMediaElement();
    adapter.setElement(element);

    await adapter.load({ path: 'C:\\media\\demo.mp3', kind: 'audio' });
    Object.defineProperty(element, 'error', { value: { code: 4 } });
    element.dispatchEvent(new Event('error'));

    expect(adapter.getState().status).toBe('error');
    expect(adapter.getState().error).toContain('Media error');
  });
});
