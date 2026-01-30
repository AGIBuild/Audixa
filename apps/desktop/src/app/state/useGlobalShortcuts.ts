import { useEffect, useRef } from 'react';
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { createLogger } from '../data/logger';

const logger = createLogger('GlobalShortcuts');

export type ShortcutAction =
  | 'togglePlay'
  | 'prevSubtitle'
  | 'nextSubtitle'
  | 'toggleFullscreen'
  | 'toggleLoop'
  | 'toggleMask'
  | 'saveListening'
  | 'decreaseRate'
  | 'increaseRate';

export type ShortcutHandlers = {
  [K in ShortcutAction]?: () => void;
};

type ShortcutConfig = {
  accelerator: string;
  action: ShortcutAction;
};

// All shortcuts use Ctrl+Alt modifier to avoid conflicts.
const shortcuts: ShortcutConfig[] = [
  { accelerator: 'ctrl+alt+space', action: 'togglePlay' },
  { accelerator: 'ctrl+alt+left', action: 'prevSubtitle' },
  { accelerator: 'ctrl+alt+right', action: 'nextSubtitle' },
  { accelerator: 'ctrl+alt+f', action: 'toggleFullscreen' },
  { accelerator: 'ctrl+alt+l', action: 'toggleLoop' },
  { accelerator: 'ctrl+alt+m', action: 'toggleMask' },
  { accelerator: 'ctrl+alt+s', action: 'saveListening' },
  { accelerator: 'ctrl+alt+[', action: 'decreaseRate' },
  { accelerator: 'ctrl+alt+]', action: 'increaseRate' },
];

// Delay before registering shortcuts - must be long enough for database to initialize
// to avoid competing for Tauri IPC channel
const REGISTRATION_DELAY_MS = 3000;

async function unregisterAllShortcuts(): Promise<void> {
  for (const shortcut of shortcuts) {
    try {
      const registered = await isRegistered(shortcut.accelerator);
      if (registered) {
        await unregister(shortcut.accelerator);
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
}

/**
 * System-wide global keyboard shortcuts for player controls.
 * Uses Tauri's global-shortcut plugin for true global shortcuts.
 * Registration is delayed to avoid blocking UI at startup.
 */
export function useGlobalShortcuts(handlers: ShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let mounted = true;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let unlistenClosePromise: Promise<() => void> | null = null;

    const registerShortcuts = async () => {
      try {
        await unregisterAllShortcuts();

        if (!mounted) return;

        for (const shortcut of shortcuts) {
          await register(shortcut.accelerator, (event) => {
            // Only trigger on key down, not key up
            if (event.state === 'Pressed') {
              const handler = handlersRef.current[shortcut.action];
              if (handler) {
                handler();
              }
            }
          });
        }

        // Register close handler only after shortcuts are ready
        if (mounted) {
          unlistenClosePromise = getCurrentWindow().onCloseRequested(async () => {
            await unregisterAllShortcuts();
          });
        }
      } catch (err) {
        logger.error('Failed to register shortcuts', err);
      }
    };

    // Delay registration to avoid competing with database initialization
    delayTimer = setTimeout(() => {
      delayTimer = null;
      void registerShortcuts();
    }, REGISTRATION_DELAY_MS);

    return () => {
      mounted = false;
      if (delayTimer) {
        clearTimeout(delayTimer);
      }
      void unregisterAllShortcuts();
      if (unlistenClosePromise) {
        void unlistenClosePromise.then((fn) => fn());
      }
    };
  }, []);
}
