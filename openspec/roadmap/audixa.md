# Audixa Product Roadmap (Planning Artifact)

This document describes the high-level product roadmap and how to slice work into OpenSpec changes.
It is not an implementation spec; each milestone should result in one or more `openspec/changes/<change-id>/` proposals.

## Product principles
- Subtitle-first interaction: subtitles are the primary UI for navigation and learning.
- Single source of truth: playback state is owned by a single service, not duplicated in views.
- Source as plugins: Local/SMB/WebDAV/etc. are `ISourceProvider` implementations.
- Local-first, sync-ready: SQLite is the system of record in MVP; v2 adds sync without schema rewrite.
- Playback input normalization: `PlaybackInput` supports direct URI, seekable stream, and local HTTP proxy.

## Target platforms
- MVP: Windows (Desktop) + Android
- Next: iOS + macOS
- Explicitly out of scope: Browser (for now)

## MVP constraints (confirmed)
- Desktop video playback MAY support a limited set of codecs/containers.
- Future: add optional transcoding proxy (e.g., FFmpeg) to convert unsupported formats into supported streams.
- Subtitles MVP: external SRT/VTT only (bilingual via two tracks).
- Sources MVP: Local + SMB only.
- Persistence MVP: SQLite only; cloud sync starts at v2.

## Capability map (future OpenSpec capabilities)
- `app-shell`: navigation, overlays (mini player + notifications)
- `media-playback`: playback orchestration, adapters, normalized inputs
- `subtitle-system`: parsing, dual tracks, masking, click-to-seek, offsets
- `source-access`: Local, SMB, later WebDAV/DLNA/cloud integrations
- `local-storage`: SQLite schema, migrations, sync-ready metadata + outbox
- `learning-loop`: saved sentences, vocabulary, stats, review lists
- `dictionary`: lookup UX + data source (later)
- `sync`: cloud sync engine and conflict rules (v2)

## Milestones and suggested change proposals

### M0 — Spec foundation (Done: proposal only)
- Goal: establish architecture, requirements, and implementation tasks.
- Change:
  - `add-audixa-mvp-foundation`

### M1 — App composition + Shell UI
- Goal: DI, view model composition, Shell navigation, global overlays host.
- Candidate changes:
  - `add-audixa-di-and-composition`
  - `add-audixa-shell-navigation`
  - `add-audixa-notification-host`
  - `add-audixa-mini-player-overlay`

### M2 — Playback core (no sources yet)
- Goal: define adapter contracts and `PlaybackService` state model.
- Candidate changes:
  - `add-audixa-playback-input-abstractions`
  - `add-audixa-playback-service-core`
  - `add-audixa-android-exoplayer-adapter`
  - `add-audixa-ios-avplayer-adapter`
  - `spike-audixa-desktop-playback-adapter` (choose WebView2+HTTP proxy vs MediaFoundation)

### M3 — Subtitle MVP (SRT/VTT)
- Goal: parsing + active cue mapping + UI list + click-to-seek + masking + offsets.
- Candidate changes:
  - `add-audixa-subtitle-parsers-srt-vtt`
  - `add-audixa-subtitle-player-ui`
  - `add-audixa-subtitle-masking-and-offset`

### M4 — Source MVP (Local + SMB)
- Goal: browse/open video files, provide seek-capable inputs, integrate with playback.
- Candidate changes:
  - `add-audixa-local-source`
  - `add-audixa-smb-source-windows-unc`
  - `add-audixa-smb-source-android-client`
  - `add-audixa-source-to-playback-integration`

### M5 — SQLite persistence (sync-ready)
- Goal: local schema + migrations + progress/recents + saved sentences + vocabulary + outbox.
- Candidate changes:
  - `add-audixa-sqlite-schema-and-migrations`
  - `add-audixa-progress-and-recents-store`
  - `add-audixa-learning-store-saved-sentences`
  - `add-audixa-learning-store-vocabulary`
  - `add-audixa-local-outbox`

### M6 — Learning loop UI
- Goal: stats dashboard + lists (saved sentences, vocabulary) + basic CRUD.
- Candidate changes:
  - `add-audixa-learning-dashboard`
  - `add-audixa-review-pages`

### v1.0 — Expanded sources + dictionary
- Goal: WebDAV (Alist), better SMB UX, dictionary lookup, subtitle search (optional).
- Candidate changes:
  - `add-audixa-webdav-source`
  - `add-audixa-dictionary-lookup`
  - `add-audixa-subtitle-download` (if desired)

### v1.x — Desktop format expansion via transcoding proxy (optional)
- Goal: support more containers/codecs without changing UI logic.
- Candidate changes:
  - `add-audixa-transcoding-proxy-contracts`
  - `add-audixa-desktop-transcoding-proxy-ffmpeg` (requires license review)
  - `add-audixa-playback-http-proxy-server` (Range + buffering)

### v2.0 — Cloud sync
- Goal: multi-device sync for progress, saved sentences, vocabulary.
- Candidate changes:
  - `add-audixa-sync-protocol-and-conflict-rules`
  - `add-audixa-sync-engine`
  - `add-audixa-sync-ui-and-settings`

## Definition of Done (per milestone)
- End-to-end demo on target platforms
- Logged error surfaces in NotificationHost
- Basic unit tests for pure logic (subtitle parsing/state machines; stores)
- Data schema version bump when persistence changes


