type FfmpegPaths = {
  ffmpegPath: string;
  ffprobePath: string;
};

export async function ensureFfmpeg(): Promise<FfmpegPaths> {
  return {
    ffmpegPath: 'binaries/ffmpeg',
    ffprobePath: 'binaries/ffprobe',
  };
}
