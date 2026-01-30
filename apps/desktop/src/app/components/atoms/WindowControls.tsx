import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from '../../app.module.css';

export function WindowControls() {
  // Note: We don't track isMaximized state to avoid Tauri API calls during startup
  // that could compete with database initialization and cause UI freezes.
  // The maximize button always shows the maximize icon.

  const handleMinimize = () => {
    void getCurrentWindow().minimize();
  };

  const handleMaximize = () => {
    void getCurrentWindow().toggleMaximize();
  };

  const handleClose = () => {
    void getCurrentWindow().close();
  };

  return (
    <div className={styles.windowControls}>
      <button
        type="button"
        className={styles.windowControlButton}
        onClick={handleMinimize}
        aria-label="Minimize"
        title="Minimize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className={styles.windowControlButton}
        onClick={handleMaximize}
        aria-label="Maximize"
        title="Maximize"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </button>
      <button
        type="button"
        className={`${styles.windowControlButton} ${styles.windowControlClose}`}
        onClick={handleClose}
        aria-label="Close"
        title="Close"
      >
        <svg width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
