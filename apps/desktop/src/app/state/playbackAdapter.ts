import { convertFileSrc } from '@tauri-apps/api/core';
import type { MediaKind } from '../data/types';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export type PlaybackSource = {
  path: string;
  kind: MediaKind;
};

export type PlaybackState = {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  rate: number;
  error: string | null;
  source: PlaybackSource | null;
  autoPlay: boolean;
};

export type PlaybackAdapter = {
  setElement: (element: HTMLMediaElement | null) => void;
  load: (source: PlaybackSource, options?: { autoPlay?: boolean }) => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (timeSeconds: number) => void;
  setRate: (rate: number) => void;
  subscribe: (listener: (state: PlaybackState) => void) => () => void;
  getState: () => PlaybackState;
};

export function createHtmlMediaAdapter(): PlaybackAdapter {
  let element: HTMLMediaElement | null = null;
  let cleanup: (() => void) | null = null;
  let state: PlaybackState = {
    status: 'idle',
    currentTime: 0,
    duration: 0,
    rate: 1,
    error: null,
    source: null,
    autoPlay: false,
  };
  const listeners = new Set<(next: PlaybackState) => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const setState = (partial: Partial<PlaybackState>) => {
    state = { ...state, ...partial };
    notify();
  };

  const bindElement = (target: HTMLMediaElement) => {
    const handleTimeUpdate = () => {
      setState({
        currentTime: target.currentTime || 0,
        duration: Number.isFinite(target.duration) ? target.duration : 0,
      });
    };
    const handleLoadedMetadata = () => {
      setState({
        duration: Number.isFinite(target.duration) ? target.duration : 0,
        currentTime: target.currentTime || 0,
      });
    };
    const handlePlay = () => {
      setState({ status: 'playing' });
    };
    const handlePause = () => {
      setState({ status: target.ended ? 'ended' : 'paused' });
    };
    const handleEnded = () => {
      setState({ status: 'ended' });
    };
    const handleRateChange = () => {
      setState({ rate: target.playbackRate || 1 });
    };
    const handleError = () => {
      const code = target.error?.code;
      const message = code ? `Media error code ${code}.` : 'Media error.';
      setState({ status: 'error', error: message });
    };

    target.addEventListener('timeupdate', handleTimeUpdate);
    target.addEventListener('loadedmetadata', handleLoadedMetadata);
    target.addEventListener('play', handlePlay);
    target.addEventListener('pause', handlePause);
    target.addEventListener('ended', handleEnded);
    target.addEventListener('ratechange', handleRateChange);
    target.addEventListener('error', handleError);

    return () => {
      target.removeEventListener('timeupdate', handleTimeUpdate);
      target.removeEventListener('loadedmetadata', handleLoadedMetadata);
      target.removeEventListener('play', handlePlay);
      target.removeEventListener('pause', handlePause);
      target.removeEventListener('ended', handleEnded);
      target.removeEventListener('ratechange', handleRateChange);
      target.removeEventListener('error', handleError);
    };
  };

  const applySource = async (target: HTMLMediaElement, source: PlaybackSource) => {
    const resolved = isRemoteUrl(source.path) ? source.path : convertFileSrc(source.path);
    target.src = resolved;
    target.load();
  };

  const playInternal = async () => {
    if (!element) {
      setState({ status: 'error', error: 'No media element available.' });
      return;
    }
    try {
      await element.play();
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : 'Playback failed.';
      setState({ status: 'error', error: message });
    }
  };

  return {
    setElement(next) {
      if (element === next) {
        return;
      }
      cleanup?.();
      cleanup = null;
      element = next;
      if (element) {
        cleanup = bindElement(element);
        element.playbackRate = state.rate;
        if (state.source) {
          void applySource(element, state.source).then(() => {
            if (state.autoPlay) {
              void playWithReset();
            }
          });
        }
      }
    },
    load(source, options) {
      const autoPlay = options?.autoPlay ?? false;
      setState({
        status: 'loading',
        currentTime: 0,
        duration: 0,
        error: null,
        source,
        autoPlay,
      });
      if (!element) {
        return;
      }
      void applySource(element, source);
      if (autoPlay) {
        void playWithReset();
      }
    },
    play: playInternal,
    pause() {
      if (!element) {
        return;
      }
      element.pause();
    },
    seek(timeSeconds) {
      if (!element || !Number.isFinite(timeSeconds)) {
        return;
      }
      element.currentTime = Math.max(0, timeSeconds);
    },
    setRate(rate) {
      const nextRate = Number.isFinite(rate) ? rate : 1;
      setState({ rate: nextRate });
      if (element) {
        element.playbackRate = nextRate;
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    getState() {
      return state;
    },
  };

  async function playWithReset() {
    try {
      await playInternal();
    } finally {
      setState({ autoPlay: false });
    }
  }
}

function isRemoteUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}
