/**
 * Logger for Audixa - only logs warnings and errors.
 * Logs to Tauri log plugin (file with daily rotation) and console.
 */
import { warn, error } from '@tauri-apps/plugin-log';

function formatMessage(tag: string, message: string, data?: unknown): string {
  if (data !== undefined) {
    const dataStr = data instanceof Error 
      ? data.message 
      : typeof data === 'object' 
        ? JSON.stringify(data) 
        : String(data);
    return `[${tag}] ${message}: ${dataStr}`;
  }
  return `[${tag}] ${message}`;
}

export function createLogger(tag: string) {
  return {
    /** Log warning - written to file */
    warn: (message: string, data?: unknown) => {
      const formatted = formatMessage(tag, message, data);
      console.warn(formatted);
      void warn(formatted);
    },
    /** Log error - written to file */
    error: (message: string, data?: unknown) => {
      const formatted = formatMessage(tag, message, data);
      console.error(formatted);
      void error(formatted);
    },
    /** Measure execution time, only logs if it fails or exceeds threshold */
    async measure<T>(label: string, fn: () => Promise<T>, warnThresholdMs = 5000): Promise<T> {
      const start = performance.now();
      try {
        const result = await fn();
        const elapsed = performance.now() - start;
        // Only warn if execution time exceeds threshold
        if (elapsed > warnThresholdMs) {
          const formatted = formatMessage(tag, `${label} slow execution`, `${elapsed.toFixed(0)}ms`);
          console.warn(formatted);
          void warn(formatted);
        }
        return result;
      } catch (err) {
        const elapsed = (performance.now() - start).toFixed(0);
        const formatted = formatMessage(tag, `${label} failed after ${elapsed}ms`, err);
        console.error(formatted);
        void error(formatted);
        throw err;
      }
    },
  };
}
