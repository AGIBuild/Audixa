import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Playback status events
 */
export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

/**
 * Time update event payload
 */
export type TimeUpdateEvent = {
  currentTimeMs: number;
  durationMs: number;
  bufferedMs: number;
};

/**
 * Status change event payload
 */
export type StatusChangeEvent = {
  status: PlaybackStatus;
  error?: string;
};

/**
 * Native Player TurboModule Specification
 *
 * This interface defines the contract between JS and the native playback layer.
 * Platform implementations:
 * - iOS: AVPlayer
 * - Android: ExoPlayer
 */
export interface Spec extends TurboModule {
  /**
   * Load a media source for playback
   * @param uri - Media file URI or URL
   * @param autoPlay - Whether to start playback immediately
   */
  load(uri: string, autoPlay: boolean): void;

  /**
   * Start or resume playback
   */
  play(): void;

  /**
   * Pause playback
   */
  pause(): void;

  /**
   * Stop playback and release resources
   */
  stop(): void;

  /**
   * Seek to a specific time
   * @param timeMs - Target time in milliseconds
   */
  seekTo(timeMs: number): void;

  /**
   * Set playback rate
   * @param rate - Playback rate (0.5 to 4.0)
   */
  setRate(rate: number): void;

  /**
   * Set A-B loop boundaries
   * @param startMs - Loop start time in milliseconds
   * @param endMs - Loop end time in milliseconds
   * @param enabled - Whether loop is enabled
   */
  setLoop(startMs: number, endMs: number, enabled: boolean): void;

  /**
   * Get current playback time synchronously
   * @returns Current time in milliseconds
   */
  getCurrentTimeMs(): number;

  /**
   * Get total duration synchronously
   * @returns Duration in milliseconds
   */
  getDurationMs(): number;

  /**
   * Get current playback status
   */
  getStatus(): string;

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void;

  /**
   * Event listener registration (handled by EventEmitter)
   */
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NativePlayerModule');
