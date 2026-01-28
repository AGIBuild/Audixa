import { useCallback } from 'react';
import styles from '../../app.module.css';
import type { SourceItem } from '../../data/types';
import { usePlayerStore } from '../../state/playerStore';
import type { PlaybackStatus } from '../../state/playbackAdapter';

type MediaSurfaceProps = {
  source: SourceItem | null;
  status: PlaybackStatus;
};

export function MediaSurface({ source, status }: MediaSurfaceProps) {
  const setMediaElement = usePlayerStore((state) => state.setMediaElement);
  const handleMediaRef = useCallback(
    (node: HTMLMediaElement | null) => {
      setMediaElement(node);
    },
    [setMediaElement],
  );

  const isVideo = source?.kind === 'video';
  const showPlaceholder = !source || !isVideo;
  const placeholderText = !source ? 'Select media' : isVideo ? '' : 'Audio';

  return (
    <>
      {source ? (
        isVideo ? (
          <video
            ref={handleMediaRef}
            className={styles.mediaElement}
            playsInline
          />
        ) : (
          <audio ref={handleMediaRef} className={styles.audioElement} />
        )
      ) : null}
      {showPlaceholder ? (
        <div className={styles.videoPlaceholder}>{placeholderText}</div>
      ) : null}
      {status === 'loading' ? (
        <div className={styles.mediaHint}>Loading media...</div>
      ) : null}
    </>
  );
}
