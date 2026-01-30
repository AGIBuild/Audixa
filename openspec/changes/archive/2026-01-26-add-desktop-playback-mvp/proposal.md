# Change: Add desktop playback MVP

## Why
Imported media cannot be played in the desktop UI, blocking the core learning flow. A minimal playback implementation is needed to validate the workflow.

## What Changes
- Add an HTML media based playback adapter for desktop.
- Convert local file paths to playable URLs for Tauri.
- Wire play/pause/seek/rate/progress updates into the Player UI.
- Surface a deterministic error state when media cannot be loaded.

## Impact
- Affected specs: `desktop-playback`
- Affected code: `apps/desktop` Player UI, player state, playback adapter module
