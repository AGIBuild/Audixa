import { create } from 'zustand';
import { MASK_LABELS } from '@audixa/core';
import type { ScreenId } from '@audixa/core';

export type { ScreenId } from '@audixa/core';

type UiState = {
  activeScreen: ScreenId;
  maskState: number;
  activeSubtitle: string;
  listeningFilter: string;
  vocabTab: string;
  setActiveScreen: (screen: ScreenId) => void;
  toggleMask: () => void;
  setMaskState: (value: number) => void;
  setActiveSubtitle: (id: string) => void;
  setListeningFilter: (value: string) => void;
  setVocabTab: (value: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeScreen: 'library',
  maskState: 0,
  activeSubtitle: 's2',
  listeningFilter: 'All',
  vocabTab: 'Vocabulary',
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  toggleMask: () =>
    set((state) => ({ maskState: (state.maskState + 1) % MASK_LABELS.length })),
  setMaskState: (value) => set({ maskState: value }),
  setActiveSubtitle: (id) => set({ activeSubtitle: id }),
  setListeningFilter: (value) => set({ listeningFilter: value }),
  setVocabTab: (value) => set({ vocabTab: value }),
}));

export { getMaskLabel } from '@audixa/core';
