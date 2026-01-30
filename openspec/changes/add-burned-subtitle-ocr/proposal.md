# Change: Add burned-in subtitle detection and online replacement

## Why
Burned-in subtitles cannot be extracted or controlled like embedded tracks. Users need a way to detect burned-in subtitles, mask them, and replace them with searchable online subtitles.

## What Changes
- Add OCR-based burned-in subtitle detection using bundled Tesseract.js.
- Add burned-in mask overlay when online subtitle replacement is active.
- Add OpenSubtitles search, download, and cache as external subtitle tracks.
- Expose an online subtitle replacement option in the subtitle track menu.

## Impact
- Affected specs: `subtitles`
- Affected code: `apps/desktop` (Tauri commands, UI), `crates/subtitle-core` (detection logic), sidecar packaging
