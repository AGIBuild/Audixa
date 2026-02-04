import { create } from 'zustand';
import type { MediaKind } from '@audixa/utils';
import { RATE_STEPS, type LoopState, type PlaybackSource, type PlaybackStatus } from '@audixa/core';
import { getProgressPercent, clampPercent } from '@audixa/core';

/**
 * Mobile Player Store State
 */
type MobilePlayerState = {
  status: PlaybackStatus;
  playbackError: string | null;
  isPlaying: boolean;
  playbackRate: number;
  progress: number;
  duration: number;
  currentTime: number;
  loopState: LoopState;
  loopA: number;
  loopB: number;
  loopASeconds: number | null;
  loopBSeconds: number | null;
  activeSource: PlaybackSource | null;
  autoPlayNext: boolean;

  // Actions
  setStatus: (status: PlaybackStatus) => void;
  setError: (error: string | null) => void;
  setPlaybackState: (partial: Partial<MobilePlayerState>) => void;
  loadSource: (source: { uri: string; kind: MediaKind }, autoPlay?: boolean) => void;
  toggleLoop: () => void;
  setLoopBoundary: (startMs: number, endMs: number) => void;
  clearLoop: () => void;
  cyclePlaybackRate: () => void;
  setPlaybackRate: (rate: number) => void;
  setProgress: (value: number) => void;
  seekToTime: (timeSeconds: number) => void;
  updateTimeAndProgress: (currentTime: number, duration: number) => void;
  queueAutoPlay: () => void;
  clearActiveSource: () => void;
};

/**
 * Mobile Player Store
 *
 * Platform-agnostic player state management.
 * The native player adapter handles the actual playback.
 */
export const useMobilePlayerStore = create<MobilePlayerState>((set, get) => ({
  status: 'idle',
  playbackError: null,
  isPlaying: false,
  playbackRate: 1.0,
  progress: 0,
  duration: 0,
  currentTime: 0,
  loopState: 0,
  loopA: 0,
  loopB: 0,
  loopASeconds: null,
  loopBSeconds: null,
  activeSource: null,
  autoPlayNext: false,

  setStatus: (status) =>
    set({
      status,
      isPlaying: status === 'playing',
      playbackError: status === 'error' ? get().playbackError : null,
    }),

  setError: (error) =>
    set({
      status: 'error',
      playbackError: error,
      isPlaying: false,
    }),

  setPlaybackState: (partial) => set(partial),

  loadSource: (source, autoPlay = false) => {
    const playbackSource: PlaybackSource = { path: source.uri, kind: source.kind };
    set({
      activeSource: playbackSource,
      playbackError: null,
      status: 'loading',
      currentTime: 0,
      duration: 0,
      progress: 0,
      autoPlayNext: false,
    });
  },

  toggleLoop: () =>
    set((state) => {
      const nextState = ((state.loopState + 1) % 3) as LoopState;

      if (nextState === 0) {
        return {
          loopState: 0,
          loopA: 0,
          loopB: 0,
          loopASeconds: null,
          loopBSeconds: null,
        };
      }

      if (nextState === 1) {
        const loopASeconds = state.currentTime;
        const loopA =
          state.duration > 0 ? getProgressPercent(loopASeconds, state.duration) : state.progress;
        return {
          loopState: 1,
          loopA,
          loopASeconds,
          loopBSeconds: null,
        };
      }

      const loopASeconds = state.loopASeconds ?? state.currentTime;
      const loopBSeconds = Math.max(state.currentTime, loopASeconds + 0.05);
      const loopA =
        state.duration > 0 ? getProgressPercent(loopASeconds, state.duration) : state.loopA;
      const loopB =
        state.duration > 0 ? getProgressPercent(loopBSeconds, state.duration) : state.loopB;

      return {
        loopState: 2,
        loopA,
        loopB,
        loopASeconds,
        loopBSeconds,
      };
    }),

  setLoopBoundary: (startMs, endMs) => {
    const { duration } = get();
    const loopASeconds = startMs / 1000;
    const loopBSeconds = endMs / 1000;
    set({
      loopState: 2,
      loopASeconds,
      loopBSeconds,
      loopA: duration > 0 ? getProgressPercent(loopASeconds, duration) : 0,
      loopB: duration > 0 ? getProgressPercent(loopBSeconds, duration) : 0,
    });
  },

  clearLoop: () =>
    set({
      loopState: 0,
      loopA: 0,
      loopB: 0,
      loopASeconds: null,
      loopBSeconds: null,
    }),

  cyclePlaybackRate: () =>
    set((state) => {
      const currentIndex = RATE_STEPS.indexOf(state.playbackRate as (typeof RATE_STEPS)[number]);
      const nextIndex = currentIndex === -1 ? 2 : (currentIndex + 1) % RATE_STEPS.length;
      return { playbackRate: RATE_STEPS[nextIndex] ?? 1.0 };
    }),

  setPlaybackRate: (rate) => {
    const nextRate = RATE_STEPS.includes(rate as (typeof RATE_STEPS)[number]) ? rate : 1.0;
    set({ playbackRate: nextRate });
  },

  setProgress: (value) => {
    const next = clampPercent(value);
    const duration = get().duration;
    if (duration > 0) {
      set({
        progress: next,
        currentTime: (duration * next) / 100,
      });
    }
  },

  seekToTime: (timeSeconds) => {
    const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0;
    const duration = get().duration;
    set({
      currentTime: safeTime,
      progress: getProgressPercent(safeTime, duration),
    });
  },

  updateTimeAndProgress: (currentTime, duration) => {
    const progress = getProgressPercent(currentTime, duration);
    const { loopState, loopASeconds, loopBSeconds } = get();

    // Update loop markers if needed
    let loopA = get().loopA;
    let loopB = get().loopB;
    if (duration > 0 && loopASeconds !== null) {
      loopA = getProgressPercent(loopASeconds, duration);
    }
    if (duration > 0 && loopBSeconds !== null) {
      loopB = getProgressPercent(loopBSeconds, duration);
    }

    set({ currentTime, duration, progress, loopA, loopB });
  },

  queueAutoPlay: () => set({ autoPlayNext: true }),

  clearActiveSource: () =>
    set({
      activeSource: null,
      status: 'idle',
      currentTime: 0,
      duration: 0,
      progress: 0,
    }),
}));
