import { Command } from '@tauri-apps/plugin-shell';

type CommandResult = {
  code: number;
  stdout: string;
  stderr: string;
};

export async function runFfprobe(
  ffprobePath: string,
  args: string[],
): Promise<CommandResult> {
  try {
    const command = Command.sidecar(ffprobePath, args);
    const result = await command.execute();
    return {
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch {
    throw new Error('FFprobe sidecar missing. Ensure it is bundled.');
  }
}

export async function runFfmpeg(
  ffmpegPath: string,
  args: string[],
): Promise<CommandResult> {
  try {
    const command = Command.sidecar(ffmpegPath, args);
    const result = await command.execute();
    return {
      code: result.code,
      stdout: result.stdout,
      stderr: result.stderr,
    };
  } catch {
    throw new Error('FFmpeg sidecar missing. Ensure it is bundled.');
  }
}
