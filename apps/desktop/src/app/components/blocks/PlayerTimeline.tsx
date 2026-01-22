import styles from '../../app.module.css';

type PlayerTimelineProps = {
  progress: number;
  showMarkerA: boolean;
  showMarkerB: boolean;
  markerAPosition: number;
  markerBPosition: number;
};

export function PlayerTimeline({
  progress,
  showMarkerA,
  showMarkerB,
  markerAPosition,
  markerBPosition,
}: PlayerTimelineProps) {
  return (
    <div className={styles.progressTrack}>
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
