import { create } from 'zustand';
import type { MediaKind } from '../data/types';
import { createHtmlMediaAdapter, type PlaybackSource, type PlaybackStatus } from './playbackAdapter';

export type LoopState = 0 | 1 | 2;

const rateSteps = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0] as const;
const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const playbackAdapter = createHtmlMediaAdapter();
let adapterInitialized = false;

export function getProgressPercent(currentTime: number, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) {
    return 0;
  }
  return clampPercent((currentTime / duration) * 100);
}

type PlayerState = {
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
  initialize: () => void;
  setMediaElement: (element: HTMLMediaElement | null) => void;
  queueAutoPlay: () => void;
  loadSource: (
    source: { uri: string; kind: MediaKind },
    options?: { autoPlay?: boolean },
  ) => void;
  togglePlay: () => void;
  pause: () => void;
  toggleLoop: () => void;
  cyclePlaybackRate: () => void;
  setPlaybackRate: (rate: number) => void;
  setProgress: (value: number) => void;
  seekToTime: (timeSeconds: number) => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  status: 'idle',
  playbackError: null,
  isPlaying: false,
  playbackRate: 1.0,
  progress: 0,
  duration: 0,
  currentTime: 0,
  loopState: 0,
  loopA: 30,
  loopB: 46,
  loopASeconds: null,
  loopBSeconds: null,
  activeSource: null,
  autoPlayNext: false,
  initialize: () => {
    if (adapterInitialized) {
      return;
    }
    adapterInitialized = true;
    playbackAdapter.subscribe((state) => {
      const loopState = get().loopState;
      const loopASeconds = get().loopASeconds;
      const loopBSeconds = get().loopBSeconds;
      const duration = state.duration;
      let currentTime = state.currentTime;

      if (loopState === 2 && loopASeconds !== null && loopBSeconds !== null) {
        if (currentTime >= loopBSeconds - 0.02) {
          playbackAdapter.seek(loopASeconds);
          currentTime = loopASeconds;
        }
      }

      const progress = getProgressPercent(currentTime, duration);
      let loopA = get().loopA;
      let loopB = get().loopB;
      if (duration > 0 && loopASeconds !== null) {
        loopA = getProgressPercent(loopASeconds, duration);
      }
      if (duration > 0 && loopBSeconds !== null) {
        loopB = getProgressPercent(loopBSeconds, duration);
      }

      set({
        status: state.status,
        playbackError: state.error,
        isPlaying: state.status === 'playing',
        playbackRate: state.rate,
        duration,
        currentTime,
        progress,
        loopA,
        loopB,
      });
    });
  },
  setMediaElement: (element) => playbackAdapter.setElement(element),
  queueAutoPlay: () => set({ autoPlayNext: true }),
  loadSource: (source, options) => {
    const playbackSource: PlaybackSource = { path: source.uri, kind: source.kind };
    const autoPlay = options?.autoPlay ?? get().autoPlayNext;
    set({
      activeSource: playbackSource,
      playbackError: null,
      status: 'loading',
      currentTime: 0,
      duration: 0,
      progress: 0,
      autoPlayNext: false,
    });
    playbackAdapter.load(playbackSource, { autoPlay });
  },
  togglePlay: () => {
    const { status, activeSource } = get();
    if (!activeSource) {
      set({ playbackError: 'No media selected.' });
      return;
    }
    if (status === 'playing') {
      playbackAdapter.pause();
    } else {
      void playbackAdapter.play();
    }
  },
  pause: () => {
    playbackAdapter.pause();
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
  cyclePlaybackRate: () =>
    set((state) => {
      const currentIndex = rateSteps.indexOf(state.playbackRate as (typeof rateSteps)[number]);
      const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % rateSteps.length;
      const nextRate = rateSteps[nextIndex];
      playbackAdapter.setRate(nextRate);
      return { playbackRate: nextRate };
    }),
  setPlaybackRate: (rate) => {
    const nextRate = rateSteps.includes(rate as (typeof rateSteps)[number]) ? rate : 1.0;
    playbackAdapter.setRate(nextRate);
    set({ playbackRate: nextRate });
  },
  setProgress: (value) => {
    const next = clampPercent(value);
    const duration = get().duration;
    if (duration > 0) {
      playbackAdapter.seek((duration * next) / 100);
      set({
        progress: next,
        currentTime: (duration * next) / 100,
      });
    }
  },
  seekToTime: (timeSeconds) => {
    const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0;
    const duration = get().duration;
    playbackAdapter.seek(safeTime);
    set({
      currentTime: safeTime,
      progress: getProgressPercent(safeTime, duration),
    });
  },
}));
