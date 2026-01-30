import { stat, open, SeekMode } from '@tauri-apps/plugin-fs';

const HASH_CHUNK_SIZE = 65536; // 64KB

/**
 * Computes the OpenSubtitles movie hash for a video file.
 *
 * The algorithm works as follows:
 * 1. Start with the file size as a 64-bit value
 * 2. Read the first 64KB and add each 8-byte chunk (as 64-bit little-endian integer)
 * 3. Read the last 64KB and add each 8-byte chunk (as 64-bit little-endian integer)
 * 4. Return the result as a 16-character hexadecimal string
 *
 * @param filePath - Absolute path to the video file
 * @returns Promise resolving to the 16-character hex hash string
 */
export async function computeMovieHash(filePath: string): Promise<string> {
  const fileInfo = await stat(filePath);
  const fileSize = fileInfo.size;

  if (fileSize < HASH_CHUNK_SIZE * 2) {
    throw new Error('File is too small for hash calculation (minimum 128KB required).');
  }

  // Use BigInt for 64-bit arithmetic
  let hash = BigInt(fileSize);

  const file = await open(filePath, { read: true });
  try {
    // Read first 64KB
    const headBuffer = new Uint8Array(HASH_CHUNK_SIZE);
    await file.read(headBuffer);
    hash = addChunkToHash(hash, headBuffer);

    // Seek to last 64KB
    await file.seek(fileSize - HASH_CHUNK_SIZE, SeekMode.Start);
    const tailBuffer = new Uint8Array(HASH_CHUNK_SIZE);
    await file.read(tailBuffer);
    hash = addChunkToHash(hash, tailBuffer);
  } finally {
    await file.close();
  }

  // Convert to 16-character hex string (zero-padded)
  return (hash & 0xffffffffffffffffn).toString(16).padStart(16, '0');
}

/**
 * Adds a 64KB chunk to the hash by reading 8-byte little-endian integers.
 */
function addChunkToHash(hash: bigint, buffer: Uint8Array): bigint {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let result = hash;

  for (let i = 0; i < buffer.length; i += 8) {
    // Read 64-bit little-endian integer using two 32-bit reads
    const lo = view.getUint32(i, true);
    const hi = view.getUint32(i + 4, true);
    const value = BigInt(lo) + (BigInt(hi) << 32n);
    result = (result + value) & 0xffffffffffffffffn; // Keep within 64-bit bounds
  }

  return result;
}

/**
 * Gets the file size for use with OpenSubtitles API (some endpoints need it).
 */
export async function getFileSize(filePath: string): Promise<number> {
  const fileInfo = await stat(filePath);
  return fileInfo.size;
}
