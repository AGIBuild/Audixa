import { convertFileSrc } from '@tauri-apps/api/core';
import { appDataDir, join } from '@tauri-apps/api/path';
import { mkdir, readDir, remove, rename } from '@tauri-apps/plugin-fs';
import type { MediaKind } from '../data/types';
import { ensureFfmpeg } from '../data/ffmpegManager';
import { runFfmpeg, runFfprobe } from '../data/ffmpegRunner';
import { getFileName, getFileStem } from '../data/utils';

export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export type PlaybackSource = {
  path: string;
  kind: MediaKind;
};

export type PlaybackState = {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  rate: number;
  error: string | null;
  source: PlaybackSource | null;
  autoPlay: boolean;
};

export type PlaybackAdapter = {
  setElement: (element: HTMLMediaElement | null) => void;
  load: (source: PlaybackSource, options?: { autoPlay?: boolean }) => void;
  play: () => Promise<void>;
  pause: () => void;
  seek: (timeSeconds: number) => void;
  setRate: (rate: number) => void;
  subscribe: (listener: (state: PlaybackState) => void) => () => void;
  getState: () => PlaybackState;
};

export function createHtmlMediaAdapter(): PlaybackAdapter {
  let element: HTMLMediaElement | null = null;
  let cleanup: (() => void) | null = null;
  let loadSeq = 0;
  let state: PlaybackState = {
    status: 'idle',
    currentTime: 0,
    duration: 0,
    rate: 1,
    error: null,
    source: null,
    autoPlay: false,
  };
  const listeners = new Set<(next: PlaybackState) => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const setState = (partial: Partial<PlaybackState>) => {
    state = { ...state, ...partial };
    notify();
  };

  const bindElement = (target: HTMLMediaElement) => {
    const handleTimeUpdate = () => {
      setState({
        currentTime: target.currentTime || 0,
        duration: Number.isFinite(target.duration) ? target.duration : 0,
      });
    };
    const handleLoadedMetadata = () => {
      setState({
        duration: Number.isFinite(target.duration) ? target.duration : 0,
        currentTime: target.currentTime || 0,
      });
    };
    const handlePlay = () => {
      setState({ status: 'playing' });
    };
    const handlePause = () => {
      setState({ status: target.ended ? 'ended' : 'paused' });
    };
    const handleEnded = () => {
      setState({ status: 'ended' });
    };
    const handleRateChange = () => {
      setState({ rate: target.playbackRate || 1 });
    };
    const handleError = () => {
      const code = target.error?.code;
      const message = code ? `Media error code ${code}.` : 'Media error.';
      setState({ status: 'error', error: message });
    };

    target.addEventListener('timeupdate', handleTimeUpdate);
    target.addEventListener('loadedmetadata', handleLoadedMetadata);
    target.addEventListener('play', handlePlay);
    target.addEventListener('pause', handlePause);
    target.addEventListener('ended', handleEnded);
    target.addEventListener('ratechange', handleRateChange);
    target.addEventListener('error', handleError);

    return () => {
      target.removeEventListener('timeupdate', handleTimeUpdate);
      target.removeEventListener('loadedmetadata', handleLoadedMetadata);
      target.removeEventListener('play', handlePlay);
      target.removeEventListener('pause', handlePause);
      target.removeEventListener('ended', handleEnded);
      target.removeEventListener('ratechange', handleRateChange);
      target.removeEventListener('error', handleError);
    };
  };

  const applySource = async (target: HTMLMediaElement, source: PlaybackSource) => {
    const seq = (loadSeq += 1);
    const resolved = await resolveSourcePath(source);
    if (seq !== loadSeq) {
      return;
    }
    if (resolved.warning) {
      setState({ error: resolved.warning });
    }
    const src = isRemoteUrl(resolved.path) ? resolved.path : convertFileSrc(resolved.path);
    target.src = src;
    target.load();
  };

  const playInternal = async () => {
    if (!element) {
      setState({ status: 'error', error: 'No media element available.' });
      return;
    }
    try {
      await element.play();
    } catch (error) {
      if (isPlayInterruptedByLoad(error)) {
        return;
      }
      const message =
        error instanceof Error && error.message ? error.message : 'Playback failed.';
      setState({ status: 'error', error: message });
    }
  };

  return {
    setElement(next) {
      if (element === next) {
        return;
      }
      cleanup?.();
      cleanup = null;
      element = next;
      if (element) {
        cleanup = bindElement(element);
        element.playbackRate = state.rate;
        if (state.source) {
          void applySource(element, state.source).then(() => {
            if (state.autoPlay) {
              void playWithReset();
            }
          });
        }
      }
    },
    load(source, options) {
      const autoPlay = options?.autoPlay ?? false;
      setState({
        status: 'loading',
        currentTime: 0,
        duration: 0,
        error: null,
        source,
        autoPlay,
      });
      if (!element) {
        return;
      }
      void applySource(element, source);
      if (autoPlay) {
        void playWithReset();
      }
    },
    play: playInternal,
    pause() {
      if (!element) {
        return;
      }
      element.pause();
    },
    seek(timeSeconds) {
      if (!element || !Number.isFinite(timeSeconds)) {
        return;
      }
      element.currentTime = Math.max(0, timeSeconds);
    },
    setRate(rate) {
      const nextRate = Number.isFinite(rate) ? rate : 1;
      setState({ rate: nextRate });
      if (element) {
        element.playbackRate = nextRate;
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      return () => listeners.delete(listener);
    },
    getState() {
      return state;
    },
  };

  async function playWithReset() {
    try {
      await playInternal();
    } finally {
      setState({ autoPlay: false });
    }
  }
}

function isRemoteUrl(value: string) {
  return value.startsWith('http://') || value.startsWith('https://');
}

function isPlayInterruptedByLoad(error: unknown) {
  const message = error instanceof Error && error.message ? error.message : '';
  if (message && /interrupted by a new load request/i.test(message)) {
    return true;
  }
  return error instanceof DOMException && error.name === 'AbortError';
}

function isMkvPath(value: string) {
  return value.toLowerCase().endsWith('.mkv');
}

type ResolvedSource = {
  path: string;
  warning: string | null;
};

const remuxTasks = new Map<string, Promise<string>>();

async function resolveSourcePath(source: PlaybackSource): Promise<ResolvedSource> {
  if (isRemoteUrl(source.path)) {
    return { path: source.path, warning: null };
  }
  if (source.kind !== 'video' || !isMkvPath(source.path)) {
    return { path: source.path, warning: null };
  }
  try {
    const remuxedPath = await ensureRemuxedPath(source.path);
    return { path: remuxedPath, warning: null };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Failed to remux MKV for playback.';
    return { path: source.path, warning: message };
  }
}

async function ensureRemuxedPath(sourcePath: string) {
  const cached = remuxTasks.get(sourcePath);
  if (cached) {
    return cached;
  }
  const task = (async () => {
    const codec = await getPrimaryVideoCodec(sourcePath);
    const shouldTranscode = codec !== 'h264';
    const cacheDir = await getMediaCacheDir();
    const mode = shouldTranscode ? 'x264' : 'copy';
    const baseName = getFileStem(getFileName(sourcePath));
    const safeName = sanitizeFileName(baseName || 'video');
    const outputName = `${safeName}-${hashPath(
      `${sourcePath}:${mode}`,
    )}.mp4`;
    const outputPath = await join(cacheDir, outputName);
    if (await fileExists(cacheDir, outputName)) {
      if (await isValidMediaFile(outputPath)) {
        return outputPath;
      }
      await remove(outputPath);
    }
    const { ffmpegPath } = await ensureFfmpeg();
    const tempPath = await join(cacheDir, `${outputName}.tmp-${Date.now()}.mp4`);
    if (shouldTranscode) {
      const result = await runFfmpeg(ffmpegPath, [
        '-y',
        '-v',
        'error',
        '-i',
        sourcePath,
        '-map',
        '0:v:0',
        '-map',
        '0:a:0?',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '20',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-movflags',
        '+faststart',
        tempPath,
      ]);
      if (result.code !== 0) {
        await safeRemove(tempPath);
        throw new Error(
          `Failed to transcode MKV to MP4: ${result.stderr || 'Unknown error'}`,
        );
      }
      if (!(await isValidMediaFile(tempPath))) {
        await safeRemove(tempPath);
        throw new Error('Transcoded file is invalid.');
      }
      await rename(tempPath, outputPath);
      return outputPath;
    }

    const remux = await runFfmpeg(ffmpegPath, [
      '-y',
      '-v',
      'error',
      '-i',
      sourcePath,
      '-map',
      '0',
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      tempPath,
    ]);
    if (remux.code === 0 && (await isValidMediaFile(tempPath))) {
      await rename(tempPath, outputPath);
      return outputPath;
    }
    await safeRemove(tempPath);
    const transcode = await runFfmpeg(ffmpegPath, [
      '-y',
      '-v',
      'error',
      '-i',
      sourcePath,
      '-map',
      '0:v:0',
      '-map',
      '0:a:0?',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '20',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      tempPath,
    ]);
    if (transcode.code !== 0) {
      await safeRemove(tempPath);
      throw new Error(
        `Failed to transcode MKV to MP4: ${transcode.stderr || 'Unknown error'}`,
      );
    }
    if (!(await isValidMediaFile(tempPath))) {
      await safeRemove(tempPath);
      throw new Error('Transcoded file is invalid.');
    }
    await rename(tempPath, outputPath);
    return outputPath;
  })();
  remuxTasks.set(sourcePath, task);
  return task;
}

async function getMediaCacheDir() {
  const base = await appDataDir();
  const dir = await join(base, 'media-cache');
  await mkdir(dir, { recursive: true });
  return dir;
}

async function fileExists(dir: string, targetName: string) {
  const entries = await readDir(dir).catch(() => []);
  return entries.some((entry) => entry.name === targetName);
}

function hashPath(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
}

async function getPrimaryVideoCodec(sourcePath: string) {
  try {
    const { ffprobePath } = await ensureFfmpeg();
    const result = await runFfprobe(ffprobePath, [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=codec_name',
      '-of',
      'json',
      sourcePath,
    ]);
    if (result.code !== 0) {
      return 'unknown';
    }
    const payload = JSON.parse(result.stdout || '{}') as {
      streams?: Array<{ codec_name?: string }>;
    };
    const codec = payload.streams?.[0]?.codec_name;
    return codec || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function isValidMediaFile(path: string) {
  try {
    const { ffprobePath } = await ensureFfmpeg();
    const result = await runFfprobe(ffprobePath, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-show_entries',
      'stream=codec_type,codec_name',
      '-of',
      'json',
      path,
    ]);
    if (result.code !== 0) {
      return false;
    }
    const payload = JSON.parse(result.stdout || '{}') as {
      format?: { duration?: string };
      streams?: Array<{ codec_type?: string; codec_name?: string }>;
    };
    const duration = Number.parseFloat(payload.format?.duration ?? '0');
    if (!Number.isFinite(duration) || duration <= 0) {
      return false;
    }
    const hasVideo = payload.streams?.some(
      (stream) => stream.codec_type === 'video' && stream.codec_name,
    );
    return Boolean(hasVideo);
  } catch {
    return false;
  }
}

async function safeRemove(path: string) {
  try {
    await remove(path);
  } catch {
    // Ignore cleanup errors.
  }
}
