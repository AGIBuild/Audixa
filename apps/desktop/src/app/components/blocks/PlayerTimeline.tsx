import type { MouseEvent } from 'react';
import styles from '../../app.module.css';

type PlayerTimelineProps = {
  progress: number;
  showMarkerA: boolean;
  showMarkerB: boolean;
  markerAPosition: number;
  markerBPosition: number;
  onSeek?: (value: number) => void;
};

export function PlayerTimeline({
  progress,
  showMarkerA,
  showMarkerB,
  markerAPosition,
  markerBPosition,
  onSeek,
}: PlayerTimelineProps) {
  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onSeek) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = rect.width === 0 ? 0 : (event.clientX - rect.left) / rect.width;
    const percent = Math.max(0, Math.min(100, ratio * 100));
    onSeek(percent);
  };

  return (
    <div className={styles.progressTrack} onClick={handleClick} role="presentation">
      <div className={styles.progressActive} style={{ width: `${progress}%` }} />
      <div
        className={`${styles.abMarker} ${showMarkerA ? styles.abMarkerActive : ''}`}
        style={{ left: `${markerAPosition}%` }}
      >
        A
      </div>
      <div
        className={`${styles.abMarker} ${showMarkerB ? styles.abMarkerActive : ''}`}
        style={{ left: `${markerBPosition}%` }}
      >
        B
      </div>
    </div>
  );
}
