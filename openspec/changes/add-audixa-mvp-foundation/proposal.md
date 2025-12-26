# Change: Audixa MVP foundation (Local + SMB + Video + External Subtitles)

## Why
Audixa aims to combine modern source access (Local/NAS) with language-learning-first playback. Existing players are optimized for entertainment and lack subtitle-first interaction (click-to-seek, masking, sentence navigation) and learning loop persistence.

## What Changes
- Add a cross-platform MVP architecture for Audixa built on Avalonia + MVVM + DI.
- Implement MVP sources: **Local** and **SMB**.
- Implement MVP playback: **Video required**, using platform-native adapters (**Android ExoPlayer**, **iOS AVFoundation**, **Desktop TBD via spike**).
- Implement MVP subtitles: external **SRT/VTT** only (bilingual via two tracks), with click-to-seek, masking, and offset.
- Add local persistence with **SQLite** for playback progress, recents, saved sentences, and vocabulary.
- Keep Desktop playback intentionally limited by OS codec availability in MVP, and design a future-ready path for on-the-fly transcoding into supported streams.
- Keep the design **sync-ready** for v2.0 cloud sync (stable IDs + change tracking), but do not ship cloud sync in MVP.
- Implement MVP UI/UX aligned with the provided prototypes under `docs/` (desktop follows layout and interactions; mobile uses responsive adaptations while preserving interactions).

## Non-Goals (MVP)
- Browser platform
- WebDAV/DLNA and cloud-drive APIs (Quark/Ali/Baidu)
- Embedded subtitle extraction (from container formats)
- ASS effects and advanced subtitle rendering
- Online subtitle search/download
- Whisper/ASR subtitle generation
- Lossless time-stretch (pitch-preserving speed); MVP allows pitch change
- Real-time transcoding (e.g., FFmpeg) for unsupported formats (architecture only in MVP)

## Impact
- **New specs (proposed capabilities)**:
  - `app-shell`
  - `ui-prototype`
  - `source-access`
  - `media-playback`
  - `subtitle-system`
  - `local-storage`
  - `learning-loop`
- **Affected code**:
  - Shared project `src/AgiBuild.Audixa` (new services, view models, views, persistence)
  - Platform projects `src/AgiBuild.Audixa.Android`, `src/AgiBuild.Audixa.iOS`, `src/AgiBuild.Audixa.Desktop` (playback adapter + platform interop)


