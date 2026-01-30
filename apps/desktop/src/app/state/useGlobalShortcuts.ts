import { useEffect, useRef } from 'react';
import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { getCurrentWindow } from '@tauri-apps/api/window';

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
 */
export function useGlobalShortcuts(handlers: ShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let mounted = true;

    const registerShortcuts = async () => {
      try {
        // Unregister all first to avoid duplicates on hot reload
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
      } catch (error) {
        console.error('Failed to register global shortcuts:', error);
      }
    };

    void registerShortcuts();

    // Also unregister on window close to ensure cleanup
    const unlistenClose = getCurrentWindow().onCloseRequested(async () => {
      await unregisterAllShortcuts();
    });

    return () => {
      mounted = false;
      void unregisterAllShortcuts();
      void unlistenClose.then((fn) => fn());
    };
  }, []);
}
