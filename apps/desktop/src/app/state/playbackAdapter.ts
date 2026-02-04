import { convertFileSrc } from '@tauri-apps/api/core';
import type { PlaybackSource, PlaybackState, PlaybackStatus } from '@audixa/core';
import type { PlaybackAdapter } from '@audixa/core';

// Re-export types for local use
export type { PlaybackSource, PlaybackState, PlaybackStatus, PlaybackAdapter } from '@audixa/core';

/**
 * HTML Media Adapter - extends base PlaybackAdapter with setElement for DOM
 */
export type HtmlMediaAdapter = PlaybackAdapter & {
  setElement: (element: HTMLMediaElement | null) => void;
};

export function createHtmlMediaAdapter(): HtmlMediaAdapter {
  let element: HTMLMediaElement | null = null;
  let cleanup: (() => void) | null = null;
  let loadSeq = 0;
  let lastTimeUpdateAt = 0;
  const timeUpdateMinIntervalMs = 250;
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
      const now = performance.now();
      if (now - lastTimeUpdateAt < timeUpdateMinIntervalMs) {
        return;
      }
      lastTimeUpdateAt = now;
      setState({
        currentTime: target.currentTime || 0,
        duration: Number.isFinite(target.duration) ? target.duration : 0,
      });
    };
    const handleLoadedMetadata = () => {
      lastTimeUpdateAt = 0;
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
      let message = 'Media error.';
      if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        message = 'Format not supported. Try MP4, MP3, or WebM.';
      } else if (code) {
        message = `Media error code ${code}.`;
      }
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

  const applySource = (target: HTMLMediaElement, source: PlaybackSource) => {
    const seq = (loadSeq += 1);
    const src = isRemoteUrl(source.path) ? source.path : convertFileSrc(source.path);
    target.src = src;
    target.load();
    return seq;
  };

  const playInternal = async () => {
    if (!element) {
      setState({ status: 'error', error: 'No media element available.' });
      return;
    }
    try {
      await element.play();
    } catch (error) {
      if (isPlayInterruptedByLoad(error)) {
        return;
      }
      const message =
        error instanceof Error && error.message ? error.message : 'Playback failed.';
      setState({ status: 'error', error: message });
    }
  };

  async function playWithReset() {
    try {
      await playInternal();
    } finally {
      setState({ autoPlay: false });
    }
  }

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
          applySource(element, state.source);
          if (state.autoPlay) {
            void playWithReset();
          }
        }
      }
    },
    load(source, options) {
      const autoPlay = options?.autoPlay ?? false;
      lastTimeUpdateAt = 0;
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
      applySource(element, source);
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
}

function isRemoteUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}

function isPlayInterruptedByLoad(error: unknown) {
  const message = error instanceof Error && error.message ? error.message : '';
  if (message && /interrupted by a new load request/i.test(message)) {
    return true;
  }
  return error instanceof DOMException && error.name === 'AbortError';
}
