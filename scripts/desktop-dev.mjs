import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const desktopCwd = path.join(repoRoot, 'apps', 'desktop');
const devUrl = 'http://127.0.0.1:4201/';

function isServerReady(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode && response.statusCode < 500);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await isServerReady(url)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function spawnShellCommand(command, options) {
  return spawn(command, { stdio: 'inherit', shell: true, ...options });
}

function tryKillStaleProcesses() {
  if (process.platform !== 'win32') {
    return;
  }
  // Kill stale processes silently to avoid file-lock issues on Windows.
  for (const imageName of ['app.exe', 'Audixa.exe']) {
    spawn(`taskkill /IM ${imageName} /F >nul 2>&1`, {
      shell: true,
      stdio: 'ignore',
    });
  }
}

async function main() {
  const serverReady = await isServerReady(devUrl);
  let viteProcess = null;

  if (!serverReady) {
    console.log('[dev] Starting Vite...');
    viteProcess = spawnShellCommand(
      'pnpm -w exec -- vite --config apps/desktop/vite.config.mts --port 4201 --host 127.0.0.1 --strictPort',
      { cwd: repoRoot, env: process.env },
    );
    viteProcess.on('error', (error) => {
      console.error(`[dev] Vite error: ${error.message}`);
    });
    const ready = await waitForServer(devUrl, 40000);
    if (!ready) {
      viteProcess.kill('SIGINT');
      throw new Error('Vite did not start in time.');
    }
  } else {
    console.log('[dev] Vite already running.');
  }

  tryKillStaleProcesses();

  console.log('[dev] Starting Tauri...');
  const devEnv = { ...process.env };
  delete devEnv.CARGO_TARGET_DIR;
  delete devEnv.cargo_target_dir;

  const tauriProcess = spawnShellCommand('pnpm -w exec tauri dev', {
    cwd: desktopCwd,
    env: { ...devEnv, CARGO_INCREMENTAL: devEnv.CARGO_INCREMENTAL ?? '0' },
  });

  const cleanup = (code) => {
    if (viteProcess && !viteProcess.killed) {
      viteProcess.kill('SIGINT');
    }
    process.exit(code ?? 0);
  };

  tauriProcess.on('exit', (code) => cleanup(code ?? 0));
  tauriProcess.on('error', (error) => {
    console.error(`[dev] Tauri error: ${error.message}`);
    cleanup(1);
  });
}

main().catch((error) => {
  console.error(`[dev] ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
