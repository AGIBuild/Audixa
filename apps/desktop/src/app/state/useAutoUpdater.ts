import { useEffect, useState, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'error'
  | 'up-to-date';

export interface UpdateState {
  status: UpdateStatus;
  version: string | null;
  error: string | null;
  progress: number;
}

export function useAutoUpdater(checkOnMount = true) {
  const [state, setState] = useState<UpdateState>({
    status: 'idle',
    version: null,
    error: null,
    progress: 0,
  });
  const [update, setUpdate] = useState<Update | null>(null);

  const checkForUpdate = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'checking', error: null }));
    try {
      const result = await check();
      if (result) {
        setUpdate(result);
        setState({
          status: 'available',
          version: result.version,
          error: null,
          progress: 0,
        });
      } else {
        setState({
          status: 'up-to-date',
          version: null,
          error: null,
          progress: 0,
        });
      }
    } catch (err) {
      setState({
        status: 'error',
        version: null,
        error: err instanceof Error ? err.message : 'Update check failed',
        progress: 0,
      });
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!update) {
      return;
    }
    setState((prev) => ({ ...prev, status: 'downloading', progress: 0 }));
    try {
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength ?? 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setState((prev) => ({
                ...prev,
                progress: Math.round((downloaded / contentLength) * 100),
              }));
            }
            break;
          case 'Finished':
            setState((prev) => ({ ...prev, status: 'ready', progress: 100 }));
            break;
        }
      });

      // Relaunch the app to apply the update
      await relaunch();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Download failed',
      }));
    }
  }, [update]);

  const dismissUpdate = useCallback(() => {
    setState({
      status: 'idle',
      version: null,
      error: null,
      progress: 0,
    });
    setUpdate(null);
  }, []);

  useEffect(() => {
    if (checkOnMount) {
      // Delay initial check to avoid blocking app startup
      const timer = setTimeout(() => {
        void checkForUpdate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [checkOnMount, checkForUpdate]);

  return {
    ...state,
    checkForUpdate,
    downloadAndInstall,
    dismissUpdate,
    hasUpdate: state.status === 'available',
  };
}
