import { useEffect, useRef, useState } from 'react';
import styles from '../../app.module.css';
import { AppButton } from '../atoms/AppButton';
import { IconGlyph } from '../atoms/IconGlyph';
import { IconButton } from '../atoms/IconButton';
import { PrimaryButton } from '../atoms/PrimaryButton';
import type { SubtitleTrack } from '../../state/subtitleStore';

type PlayerTransportProps = {
  maskLabel: string;
  isPlaying: boolean;
  playbackRate: number;
  loopState: number;
  subtitleTracks: SubtitleTrack[];
  activeSubtitleTrackId: string | null;
  onMaskToggle: () => void;
  onTogglePlay: () => void;
  onPrevSubtitle: () => void;
  onNextSubtitle: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onToggleLoop: () => void;
  onCycleRate: () => void;
  onSetRate: (value: number) => void;
  onSelectSubtitleTrack: (id: string | null) => void;
  onOpenSubtitleSearch: () => void;
  canSearchOnline: boolean;
  onReloadSubtitles: () => void;
  onSaveListening: () => void;
  onOpenPlaylist: () => void;
  isPersistDisabled: boolean;
};

export function PlayerTransport({
  maskLabel,
  isPlaying,
  playbackRate,
  loopState,
  subtitleTracks,
  activeSubtitleTrackId,
  onMaskToggle,
  onTogglePlay,
  onPrevSubtitle,
  onNextSubtitle,
  onToggleFullscreen,
  isFullscreen,
  onToggleLoop,
  onCycleRate,
  onSetRate,
  onSelectSubtitleTrack,
  onOpenSubtitleSearch,
  canSearchOnline,
  onReloadSubtitles,
  onSaveListening,
  onOpenPlaylist,
  isPersistDisabled,
}: PlayerTransportProps) {
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [isSubtitleOpen, setIsSubtitleOpen] = useState(false);
  const rateRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isRateOpen) {
      return undefined;
    }
    const handleClick = (event: MouseEvent) => {
      if (!rateRef.current?.contains(event.target as Node)) {
        setIsRateOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isRateOpen]);

  useEffect(() => {
    if (!isSubtitleOpen) {
      return undefined;
    }
    const handleClick = (event: MouseEvent) => {
      if (!subtitleRef.current?.contains(event.target as Node)) {
        setIsSubtitleOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isSubtitleOpen]);

  const rateOptions = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4];
  const subtitleOptions = [
    { id: null, label: 'Off' },
    ...subtitleTracks.map((track) => ({
      id: track.id,
      label: track.label,
    })),
  ];

  return (
    <div className={styles.controlsRow}>
      <div className={styles.leftControls}>
        <IconButton
          className={styles.transportIconButton}
          onClick={onMaskToggle}
          aria-label={maskLabel}
          title={maskLabel}
        >
          <IconGlyph name="mask" />
        </IconButton>
        <div className={styles.ratePicker} ref={subtitleRef}>
          <IconButton
            className={styles.transportIconButton}
            onClick={() => setIsSubtitleOpen((prev) => !prev)}
            aria-label="Subtitle track"
            title="Subtitle track"
          >
            <IconGlyph name="list" />
          </IconButton>
          {isSubtitleOpen ? (
            <div className={styles.rateMenu} role="listbox">
              {canSearchOnline ? (
                <button
                  type="button"
                  className={styles.rateOption}
                  onClick={() => {
                    onOpenSubtitleSearch();
                    setIsSubtitleOpen(false);
                  }}
                >
                  Search Online
                </button>
              ) : null}
              <button
                type="button"
                className={styles.rateOption}
                onClick={() => {
                  onReloadSubtitles();
                  setIsSubtitleOpen(false);
                }}
              >
                Reload subtitles
              </button>
              {subtitleOptions.map((option) => (
                <button
                  key={option.id ?? 'off'}
                  type="button"
                  className={`${styles.rateOption} ${
                    activeSubtitleTrackId === option.id
                      ? styles.rateOptionActive
                      : ''
                  }`}
                  onClick={() => {
                    onSelectSubtitleTrack(option.id);
                    setIsSubtitleOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className={styles.ratePicker} ref={rateRef}>
          <AppButton
            variant="secondary"
            onClick={() => setIsRateOpen((prev) => !prev)}
            className={styles.rateButton}
            aria-label={`Rate ${playbackRate.toFixed(1)}x`}
            title={`Rate ${playbackRate.toFixed(1)}x`}
          >
            {playbackRate.toFixed(1)}x
          </AppButton>
          {isRateOpen ? (
            <div className={styles.rateMenu} role="listbox">
              {rateOptions.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  className={`${styles.rateOption} ${
                    playbackRate === rate ? styles.rateOptionActive : ''
                  }`}
                  onClick={() => {
                    onSetRate(rate);
                    setIsRateOpen(false);
                  }}
                >
                  {rate.toFixed(2).replace(/\.00$/, '')}x
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className={styles.mainControls}>
        <IconButton
          className={styles.transportIconButton}
          aria-label="Previous subtitle"
          title="Previous subtitle"
          onClick={onPrevSubtitle}
        >
          <IconGlyph name="prev" size={28} />
        </IconButton>
        <PrimaryButton
          onClick={onTogglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
          className={styles.transportPlayButton}
        >
          <IconGlyph
            name={isPlaying ? 'pause' : 'play'}
            size={32}
            className={styles.playGlyph}
          />
        </PrimaryButton>
        <IconButton
          className={styles.transportIconButton}
          aria-label="Next subtitle"
          title="Next subtitle"
          onClick={onNextSubtitle}
        >
          <IconGlyph name="next" size={28} />
        </IconButton>
      </div>
      <div className={styles.rightControls}>
        <AppButton
          variant="ab"
          className={`${loopState === 1 ? styles.abButtonArmed : ''} ${
            loopState === 2 ? styles.abButtonActive : ''
          }`}
          onClick={onToggleLoop}
          aria-label="Loop AB"
          title="Loop AB"
        >
          <IconGlyph name="loop" />
        </AppButton>
        <IconButton
          onClick={onSaveListening}
          disabled={isPersistDisabled}
          aria-label="Save sentence"
          title="Save sentence"
          className={styles.transportIconButton}
        >
          <IconGlyph name="save" />
        </IconButton>
        <IconButton
          onClick={onToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className={styles.transportIconButton}
          isActive={isFullscreen}
          activeClassName={styles.transportIconActive}
        >
          <IconGlyph name="fullscreen" />
        </IconButton>
        <IconButton
          onClick={onOpenPlaylist}
          aria-label="Playlist"
          title="Playlist"
          className={styles.transportIconButton}
        >
          <IconGlyph name="playlist" />
        </IconButton>
      </div>
    </div>
  );
}
