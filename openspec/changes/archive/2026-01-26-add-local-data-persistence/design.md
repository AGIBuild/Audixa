## Context
The desktop app renders placeholder data from `apps/desktop/src/app/data.ts`. To enable real usage (library, recents, listening, vocabulary), the data must be loaded from a durable local store and written back on user actions.

## Goals / Non-Goals
- Goals:
  - Provide a single local data store for media library and learning data on desktop.
  - Make UI data load from the store and persist across restarts.
  - Keep the storage interface centralized to avoid duplicated logic.
- Non-Goals:
  - Cloud sync, NAS indexing, or multi-device replication.
  - Advanced search or analytics pipelines.
  - Replacing the native playback mock with a real playback engine.

## Decisions
- Decision: Use SQLite as the local store via a Tauri-compatible SQL plugin.
  - Rationale: transactional integrity, schema migrations, and predictable performance for relational data.
- Alternatives considered:
  - JSON file store via Tauri FS APIs: simpler, but weak for migrations and concurrency.
  - Embedded key-value store (e.g., sled): fast writes, but awkward for relational queries and joins.

## Data Model (Minimal)
- `media_sources`: id, title, uri, kind, created_at, updated_at
- `recent_playbacks`: id, media_source_id, progress, last_played_at
- `subtitle_tracks`: id, media_source_id, language, uri, created_at
- `listening_items`: id, media_source_id, sentence_id, start_ms, end_ms, created_at
- `vocab_items`: id, word, canonical_word, locale, definition, example, source, created_at, last_seen_at

## Risks / Trade-offs
- Plugin compatibility or OS-specific path behavior could require extra handling.
- Migration mistakes can block startup; strict versioning is required.
- Early schema choices may limit future cross-platform reuse.

## Migration Plan
- Introduce a schema version table and forward-only migrations.
- Run migrations at app startup before repositories are initialized.
- Back up or copy the database before applying breaking migrations.

## Open Questions
- Should we include optional audio segment caching in phase 1?
- Do we need to persist subtitle files or only references to their paths?
