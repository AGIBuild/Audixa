import { create } from 'zustand';
import type { SubtitleItem, SubtitleTrack, BurnedSubtitleRegion } from '@audixa/utils';

// Re-export types for consumers
export type { SubtitleTrack, BurnedSubtitleRegion } from '@audixa/utils';

type SubtitleState = {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  items: SubtitleItem[];
  error: string | null;
  burnedRegion: BurnedSubtitleRegion | null;
  burnedMaskEnabled: boolean;
  burnedDetectionError: string | null;
  setTracks: (tracks: SubtitleTrack[], activeTrackId: string | null) => void;
  setItems: (items: SubtitleItem[]) => void;
  setError: (error: string | null) => void;
  setBurnedRegion: (region: BurnedSubtitleRegion | null) => void;
  setBurnedMaskEnabled: (enabled: boolean) => void;
  setBurnedDetectionError: (error: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  clear: () => void;
};

export const useSubtitleStore = create<SubtitleState>((set) => ({
  tracks: [],
  activeTrackId: null,
  items: [],
  error: null,
  burnedRegion: null,
  burnedMaskEnabled: false,
  burnedDetectionError: null,
  setTracks: (tracks, activeTrackId) => set({ tracks, activeTrackId }),
  setItems: (items) => set({ items }),
  setError: (error) => set({ error }),
  setBurnedRegion: (region) => set({ burnedRegion: region }),
  setBurnedMaskEnabled: (enabled) => set({ burnedMaskEnabled: enabled }),
  setBurnedDetectionError: (error) => set({ burnedDetectionError: error }),
  selectTrack: (trackId) => set({ activeTrackId: trackId }),
  clear: () =>
    set({
      tracks: [],
      activeTrackId: null,
      items: [],
      error: null,
      burnedRegion: null,
      burnedMaskEnabled: false,
      burnedDetectionError: null,
    }),
}));
