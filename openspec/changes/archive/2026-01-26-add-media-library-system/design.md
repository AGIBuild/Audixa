## Context
The desktop app currently treats imported media as a flat list. We need a library concept where users can create multiple libraries backed by different sources (manual file references, local folders, WebDAV, cloud drive placeholders).

## Goals / Non-Goals
- Goals:
  - Support multiple libraries with distinct types and sources.
  - Store library metadata and items in the local database.
  - Local folder libraries keep items in sync via watcher.
  - WebDAV libraries list items on demand with manual refresh.
  - Store WebDAV credentials in the OS keychain.
- Non-Goals:
  - Full cloud drive integration (only UI placeholders).
  - Media file uploads or copies (store references only).
  - Cross-device sync.

## Decisions
- Decision: Model libraries as first-class entities with `libraries`, `library_sources`, `library_items` tables.
  - Rationale: enables multiple libraries and consistent item indexing.
- Decision: Local folder libraries use a Tauri FS watcher and rescan on changes.
  - Rationale: ensures list accuracy without full rescans.
- Decision: WebDAV listing uses HTTP PROPFIND via Tauri HTTP plugin.
  - Rationale: avoids browser CORS constraints and keeps credentials off the webview.
- Decision: WebDAV credentials stored in OS keychain with a generated key identifier.
  - Rationale: avoids storing secrets in SQLite.

## Data Model
- `libraries`: id, name, type, created_at, updated_at
- `library_sources`: id, library_id, kind, path_or_url, metadata_json, created_at
- `library_items`: id, library_id, source_id, title, uri, kind, updated_at
- `library_credentials`: id, library_id, keyring_key, created_at

## Library Types
- `local-manual`: user adds file references directly.
- `local-folder`: items derived from a directory listing (watched).
- `webdav`: items derived from remote directory listing (manual refresh).
- `cloud-drive`: UI placeholder only.

## Risks / Trade-offs
- Watcher reliability varies by OS and requires scope permissions.
- WebDAV servers vary in PROPFIND responses; parsing needs to be resilient.
- UI complexity increases for multi-library flows.

## Migration Plan
- Add schema migration (v2) to introduce library tables.
- Backfill existing imported media into a default `local-manual` library.

## Open Questions
- Should folder libraries support extension filters configurable per library?
