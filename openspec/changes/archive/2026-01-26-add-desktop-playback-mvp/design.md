## Context
The desktop app can import media but has no playback engine. We need an MVP playback path so users can play local files and validate the learning workflow.

## Goals / Non-Goals
- Goals:
  - Enable play/pause/seek/rate for imported local media.
  - Provide progress updates for the Player UI.
  - Keep a single playback adapter boundary to avoid scattered logic.
- Non-Goals:
  - Native playback core (mpv/VLC) integration.
  - ms-level precision for seek/loop or subtitle sync guarantees.

## Decisions
- Decision: Use HTMLMediaElement (audio/video) for MVP playback.
  - Rationale: fastest path to working playback with minimal dependencies.
- Decision: Convert local file paths via Tauri `convertFileSrc` before assignment.
  - Rationale: required to load local files in the webview.

## Playback Adapter
- A single adapter module owns the media element and exposes:
  - Commands: load, play, pause, seek, setRate
  - Events: time updates, duration updates, state changes, error

## Risks / Trade-offs
- Limited precision vs native playback core.
- Subtitle sync and A/B loop accuracy will be limited.

## Migration Plan
- Keep the adapter interface stable so a native playback core can replace it later.

## Open Questions
- Should we render video inside the existing placeholder or replace it entirely?
