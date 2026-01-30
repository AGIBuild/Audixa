import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import styles from '../../app.module.css';

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    // Check initial state
    void appWindow.isMaximized().then(setIsMaximized);

    // Listen for resize events to update maximize state
    const unlisten = appWindow.onResized(() => {
      void appWindow.isMaximized().then(setIsMaximized);
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, []);

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
        aria-label={isMaximized ? 'Restore' : 'Maximize'}
        title={isMaximized ? 'Restore' : 'Maximize'}
      >
        {isMaximized ? (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="2" y="4" width="6" height="6" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M4 4V2H10V8H8" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1.5" y="1.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        )}
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
