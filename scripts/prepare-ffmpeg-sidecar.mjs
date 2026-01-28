import { execSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WINDOWS_ZIP_URL =
  'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
const MAC_FFMPEG_URL = 'https://evermeet.cx/ffmpeg/ffmpeg.zip';
const MAC_FFPROBE_URL = 'https://evermeet.cx/ffmpeg/ffprobe.zip';
const LINUX_BASE_URL = 'https://johnvansickle.com/ffmpeg/releases';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const binariesDir = path.join(
  repoRoot,
  'apps',
  'desktop',
  'src-tauri',
  'binaries',
);

async function downloadFile(url, destination, redirectCount = 0) {
  await new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          if (redirectCount > 5) {
            reject(new Error('Too many redirects.'));
            return;
          }
          const nextUrl = new URL(response.headers.location, url).toString();
          response.resume();
          resolve(downloadFile(nextUrl, destination, redirectCount + 1));
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed (${response.statusCode})`));
          return;
        }
        const file = fs.createWriteStream(destination);
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', reject);
  });
}

function getTargetTriple() {
  const output = execSync('rustc -vV', { stdio: 'pipe' }).toString();
  const match = output.match(/^host:\s+(.+)$/m);
  if (!match?.[1]) {
    throw new Error('Failed to detect rust target triple.');
  }
  return match[1];
}

function findBinary(rootDir, fileName) {
  const entries = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      const match = findBinary(fullPath, fileName);
      if (match) {
        return match;
      }
    } else if (entry.isFile() && entry.name.toLowerCase() === fileName) {
      return fullPath;
    }
  }
  return null;
}

function unzipOnWindows(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execSync(
    [
      'powershell',
      '-NoProfile',
      '-Command',
      `Expand-Archive -Path "${zipPath}" -DestinationPath "${destDir}" -Force`,
    ].join(' '),
    { stdio: 'inherit' },
  );
}

function unzipOnUnix(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`unzip -q "${zipPath}" -d "${destDir}"`, { stdio: 'inherit' });
}

function untarXz(archivePath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  execSync(`tar -xJf "${archivePath}" -C "${destDir}"`, { stdio: 'inherit' });
}

function getLinuxArchiveName() {
  switch (process.arch) {
    case 'x64':
      return 'ffmpeg-release-amd64-static.tar.xz';
    case 'arm64':
      return 'ffmpeg-release-arm64-static.tar.xz';
    case 'arm':
      return 'ffmpeg-release-armhf-static.tar.xz';
    default:
      throw new Error(`Unsupported Linux arch: ${process.arch}`);
  }
}

async function main() {
  const targetTriple = getTargetTriple();
  const extension = process.platform === 'win32' ? '.exe' : '';
  const ffmpegTarget = path.join(
    binariesDir,
    `ffmpeg-${targetTriple}${extension}`,
  );
  const ffprobeTarget = path.join(
    binariesDir,
    `ffprobe-${targetTriple}${extension}`,
  );
  if (fs.existsSync(ffmpegTarget) && fs.existsSync(ffprobeTarget)) {
    console.log('FFmpeg sidecars already exist.');
    console.log(`- ${ffmpegTarget}`);
    console.log(`- ${ffprobeTarget}`);
    return;
  }
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audixa-ffmpeg-'));
  const extractDir = path.join(tempDir, 'ffmpeg');
  let ffmpegSource = null;
  let ffprobeSource = null;

  if (process.platform === 'win32') {
    const zipPath = path.join(tempDir, 'ffmpeg.zip');
    console.log('Downloading FFmpeg (Windows)...');
    await downloadFile(WINDOWS_ZIP_URL, zipPath);
    console.log('Extracting FFmpeg...');
    unzipOnWindows(zipPath, extractDir);
    ffmpegSource = findBinary(extractDir, 'ffmpeg.exe');
    ffprobeSource = findBinary(extractDir, 'ffprobe.exe');
  } else if (process.platform === 'darwin') {
    const ffmpegZip = path.join(tempDir, 'ffmpeg.zip');
    const ffprobeZip = path.join(tempDir, 'ffprobe.zip');
    console.log('Downloading FFmpeg (macOS)...');
    await downloadFile(MAC_FFMPEG_URL, ffmpegZip);
    await downloadFile(MAC_FFPROBE_URL, ffprobeZip);
    console.log('Extracting FFmpeg...');
    unzipOnUnix(ffmpegZip, extractDir);
    unzipOnUnix(ffprobeZip, extractDir);
    ffmpegSource = findBinary(extractDir, 'ffmpeg');
    ffprobeSource = findBinary(extractDir, 'ffprobe');
  } else if (process.platform === 'linux') {
    const archiveName = getLinuxArchiveName();
    const archivePath = path.join(tempDir, archiveName);
    console.log('Downloading FFmpeg (Linux)...');
    await downloadFile(`${LINUX_BASE_URL}/${archiveName}`, archivePath);
    console.log('Extracting FFmpeg...');
    untarXz(archivePath, extractDir);
    ffmpegSource = findBinary(extractDir, 'ffmpeg');
    ffprobeSource = findBinary(extractDir, 'ffprobe');
  } else {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }

  if (!ffmpegSource || !ffprobeSource) {
    throw new Error('Failed to locate ffmpeg or ffprobe in archive.');
  }

  fs.mkdirSync(binariesDir, { recursive: true });
  fs.copyFileSync(ffmpegSource, ffmpegTarget);
  fs.copyFileSync(ffprobeSource, ffprobeTarget);
  if (process.platform !== 'win32') {
    fs.chmodSync(ffmpegTarget, 0o755);
    fs.chmodSync(ffprobeTarget, 0o755);
  }

  console.log('FFmpeg sidecars ready:');
  console.log(`- ${ffmpegTarget}`);
  console.log(`- ${ffprobeTarget}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
