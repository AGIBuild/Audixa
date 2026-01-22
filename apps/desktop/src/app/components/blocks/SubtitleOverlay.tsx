import styles from '../../app.module.css';

type SubtitleOverlayProps = {
  maskState: number;
};

export function SubtitleOverlay({ maskState }: SubtitleOverlayProps) {
  return (
    <div className={styles.subtitleOverlay}>
      <div
        className={`${styles.subtitleLine} ${
          maskState === 2 || maskState === 3 ? styles.subtitleBlur : ''
        }`}
      >
        The resource acquisition process is fragmented.
      </div>
      <div
        className={`${styles.subtitleLine} ${
          maskState === 1 || maskState === 3 ? styles.subtitleBlur : ''
        }`}
      >
        Resource acquisition is fragmented.
      </div>
    </div>
  );
}
