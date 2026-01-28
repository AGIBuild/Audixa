## Context
The desktop player currently renders mock subtitles. We need to load real subtitles by preferring embedded streams in the media file and falling back to same-name external subtitle files.

## Goals / Non-Goals
- Goals:
  - Extract embedded subtitle tracks and parse them into subtitle sentences.
  - Prefer embedded subtitles, fallback to external files when embedded tracks are absent.
  - Allow users to choose a subtitle track or turn subtitles off.
  - Support local and WebDAV media sources.
- Non-Goals:
  - Full subtitle editing or translation.
  - Real-time subtitle download services.

## Decisions
- Decision: Bundle ffprobe/ffmpeg as Tauri sidecar binaries.
  - Rationale: stable extraction across formats without runtime download.
- Decision: Use Tauri shell plugin to run sidecars.
  - Rationale: avoids bundling a custom native parser.

## Extraction Strategy
- Use ffprobe to enumerate subtitle streams and their metadata (language, codec).
- Use ffmpeg to extract selected subtitle streams to a temp file for parsing.

## Fallback Strategy
- If embedded subtitles exist, select the first compatible track (language prioritized if available).
- If no embedded subtitles, look for same-name external subtitle files (`.srt/.vtt/.ass`).
- If none, subtitles are “Off”.

## Risks / Trade-offs
- Bundling increases installer size.
- WebDAV access requires temporary download of subtitle files.

## Migration Plan
- Introduce the new subtitle pipeline and keep mock subtitles as a fallback only for empty results.
