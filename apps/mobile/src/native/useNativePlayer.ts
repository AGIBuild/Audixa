import { useEffect, useRef, useCallback } from 'react';
import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { PlaybackAdapter, PlaybackState, PlaybackSource } from '@audixa/core';
import { createInitialPlaybackState } from '@audixa/core';

// Get the native module
const { NativePlayerModule } = NativeModules;

type NativePlayerEventEmitter = {
  addListener: (eventName: string, handler: (event: unknown) => void) => { remove: () => void };
};

/**
 * Create a PlaybackAdapter that wraps the native player module
 */
export function createNativePlayerAdapter(): PlaybackAdapter {
  const eventEmitter = new NativeEventEmitter(NativePlayerModule) as NativePlayerEventEmitter;
  let state: PlaybackState = createInitialPlaybackState();
  const listeners = new Set<(state: PlaybackState) => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const setState = (partial: Partial<PlaybackState>) => {
    state = { ...state, ...partial };
    notify();
  };

  // Subscribe to native events
  const timeUpdateSubscription = eventEmitter.addListener('onTimeUpdate', (event: unknown) => {
    const e = event as { currentTimeMs: number; durationMs: number };
    setState({
      currentTime: e.currentTimeMs / 1000,
      duration: e.durationMs / 1000,
    });
  });

  const statusChangeSubscription = eventEmitter.addListener('onStatusChange', (event: unknown) => {
    const e = event as { status: string; error?: string };
    setState({
      status: e.status as PlaybackState['status'],
      error: e.error ?? null,
    });
  });

  return {
    load(source: PlaybackSource, options) {
      const autoPlay = options?.autoPlay ?? false;
      setState({
        status: 'loading',
        currentTime: 0,
        duration: 0,
        error: null,
        source,
        autoPlay,
      });
      NativePlayerModule.load(source.path, autoPlay);
    },

    async play() {
      NativePlayerModule.play();
    },

    pause() {
      NativePlayerModule.pause();
    },

    seek(timeSeconds: number) {
      NativePlayerModule.seekTo(timeSeconds * 1000);
    },

    setRate(rate: number) {
      setState({ rate });
      NativePlayerModule.setRate(rate);
    },

    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },

    getState() {
      return state;
    },

    dispose() {
      timeUpdateSubscription.remove();
      statusChangeSubscription.remove();
      NativePlayerModule.stop();
    },
  };
}

/**
 * React hook for using the native player
 */
export function useNativePlayer() {
  const adapterRef = useRef<PlaybackAdapter | null>(null);

  useEffect(() => {
    // Only create adapter on native platforms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      adapterRef.current = createNativePlayerAdapter();
    }

    return () => {
      adapterRef.current?.dispose?.();
    };
  }, []);

  const load = useCallback((source: PlaybackSource, autoPlay = false) => {
    adapterRef.current?.load(source, { autoPlay });
  }, []);

  const play = useCallback(() => {
    void adapterRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    adapterRef.current?.pause();
  }, []);

  const seek = useCallback((timeSeconds: number) => {
    adapterRef.current?.seek(timeSeconds);
  }, []);

  const setRate = useCallback((rate: number) => {
    adapterRef.current?.setRate(rate);
  }, []);

  return {
    adapter: adapterRef.current,
    load,
    play,
    pause,
    seek,
    setRate,
  };
}
