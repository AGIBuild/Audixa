import { create } from 'zustand';

export type LoopState = 0 | 1 | 2;

const rateSteps = [0.8, 1.0, 1.25, 1.5] as const;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

type PlayerState = {
  isPlaying: boolean;
  playbackRate: number;
  progress: number;
  loopState: LoopState;
  loopA: number;
  loopB: number;
  togglePlay: () => void;
  toggleLoop: () => void;
  tick: () => void;
  cyclePlaybackRate: () => void;
  setPlaybackRate: (rate: number) => void;
  setProgress: (value: number) => void;
};

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  playbackRate: 1.0,
  progress: 38,
  loopState: 0,
  loopA: 30,
  loopB: 46,
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  toggleLoop: () =>
    set((state) => {
      const nextState = ((state.loopState + 1) % 3) as LoopState;
      if (nextState === 0) {
        return { loopState: 0 };
      }
      if (nextState === 1) {
        return { loopState: 1, loopA: state.progress };
      }
      return {
        loopState: 2,
        loopB: Math.max(state.progress, state.loopA + 1),
      };
    }),
  tick: () =>
    set((state) => {
      if (!state.isPlaying) {
        return {};
      }
      const delta = state.playbackRate * 0.8;
      let next = clampPercent(state.progress + delta);
      if (state.loopState === 2 && next >= state.loopB) {
        next = state.loopA;
      }
      if (next >= 100) {
        return { progress: 100, isPlaying: false };
      }
      return { progress: next };
    }),
  cyclePlaybackRate: () =>
    set((state) => {
      const currentIndex = rateSteps.indexOf(state.playbackRate as (typeof rateSteps)[number]);
      const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % rateSteps.length;
      return { playbackRate: rateSteps[nextIndex] };
    }),
  setPlaybackRate: (rate) => set({ playbackRate: rateSteps.includes(rate as (typeof rateSteps)[number]) ? rate : 1.0 }),
  setProgress: (value) => set({ progress: clampPercent(value) }),
}));
