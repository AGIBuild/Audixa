# Project Context

## Purpose
Audixa is a subtitle-first, cross-platform audio/video learning player.
It treats subtitle sentences as first-class entities (seek by sentence, A/B loop, masking, statistics) to turn content consumption into measurable language-learning behavior.

## Tech Stack
- Mobile: React Native (Bare, RN 0.72+), Hermes, Fabric, TurboModules/JSI
- Desktop: React UI + Tauri (preferred) or Electron (fallback)
- Native playback core:
  - iOS: AVPlayer
  - Android: ExoPlayer
  - Desktop: mpv (FFmpeg) / VLC core (optional)
- Monorepo: Nx
- Package manager: pnpm
- State management (intended): Zustand for high-frequency player/subtitle state; Redux Toolkit for complex domain workflows
- Navigation (intended): React Navigation v6 + Native Stack
- Animations/gestures (intended): Reanimated 2 + Gesture Handler

## Project Conventions

### Code Style
- Code, comments, and commit messages are in English.
- Prefer simple, proven patterns; avoid duplicating the same responsibility across multiple services/components.
- Keep a single “source of truth” per concern (e.g., subtitle parsing/indexing lives in the subtitle engine, not scattered in UI).

### Architecture Patterns
Layering (cross-platform first, native where required):
- Native Playback Core (platform-specific): precise seek (ms), A/B loop, background/lock-screen playback, hardware decode.
- Cross-platform Core:
  - Subtitle Engine: load (SRT/VTT/ASS), parse/normalize into sentence[], time index (ms -> sentence), masking/loop state.
  - Learning Engine: sentence-level learning records, event collection, stats models.
- UI Layer (shared React / RN): subtitle overlay + list + learning surfaces.

Interop:
- Use JSI/TurboModules/IPC for time-critical commands (seek/loop) and for delivering time updates to JS predictably.

Suggested monorepo package layout:
- packages/core (player control, subtitle engine, learning engine, cache)
- packages/ui (shared component library, theming)
- packages/modules (learning center, repeat/AB loop page, subtitle interactions)
- packages/utils (types, API wrappers)
- packages/config (env, i18n)

### Testing Strategy
- Core engines: unit tests for parsing, normalization, time indexing, loop/masking state machines.
- Integration tests: native player bridge seek/loop correctness (ms accuracy) and event ordering.
- UI: minimal smoke tests for critical flows (open media -> load subtitles -> sentence seek -> AB loop).

### Git Workflow
- Branching: feature-branch + PR.
- Commit convention: Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`, `chore:`).

## Domain Context
- Subtitle sentences are the primary learning unit.
- Key interactions: sentence click-to-seek, A/B loop by sentence boundaries, masking/blur, play/loop counts, mastery level, learning statistics.
- Local-first playback (phase 1): local files and NAS; optional cloud sync for learning data later.

## Important Constraints
- Playback control must be native-grade and precise (ms-level seek/loop).
- Cross-platform UI/logic reuse is a priority; native modules remain extensible for performance-critical features.

## External Dependencies
- Potential media sources: local filesystem, NAS, cloud drives (future).
- Optional storage/sync: SQLite/IndexedDB local; cloud sync service (future).
