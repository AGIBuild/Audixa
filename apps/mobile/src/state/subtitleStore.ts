import { create } from 'zustand';
import type { SubtitleItem, SubtitleTrack, BurnedSubtitleRegion } from '@audixa/utils';

/**
 * Mobile Subtitle Store State
 */
type MobileSubtitleState = {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  items: SubtitleItem[];
  error: string | null;

  // Actions
  setTracks: (tracks: SubtitleTrack[], activeTrackId?: string | null) => void;
  setItems: (items: SubtitleItem[]) => void;
  setError: (error: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  clear: () => void;
};

/**
 * Mobile Subtitle Store
 */
export const useMobileSubtitleStore = create<MobileSubtitleState>((set) => ({
  tracks: [],
  activeTrackId: null,
  items: [],
  error: null,

  setTracks: (tracks, activeTrackId = null) =>
    set({ tracks, activeTrackId: activeTrackId ?? tracks[0]?.id ?? null }),

  setItems: (items) => set({ items }),

  setError: (error) => set({ error }),

  selectTrack: (trackId) => set({ activeTrackId: trackId }),

  clear: () =>
    set({
      tracks: [],
      activeTrackId: null,
      items: [],
      error: null,
    }),
}));
