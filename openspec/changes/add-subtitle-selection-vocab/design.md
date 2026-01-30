## Context
We already support saving sentences and vocabulary entries, but vocabulary definitions are placeholders and subtitle list text is not selectable.

## Goals / Non-Goals
- Goals:
  - Allow text selection in the subtitle list and open a lookup panel.
  - Fetch real definitions/pronunciations from an online dictionary provider.
  - Persist pronunciation data in the vocabulary store.
- Non-Goals:
  - Offline dictionary packs.
  - Full translation of sentences or multi-language dictionary support.

## Decisions
- Decision: Use a public dictionary API for English lookups.
  - Rationale: No API key required, fast integration, and good coverage.
  - Provider: Free Dictionary API (`https://api.dictionaryapi.dev`).
- Decision: Store pronunciation on the vocab entry as an optional field.
  - Rationale: Satisfy learning requirements and show phonetics in the Vocabulary screen.
- Decision: Subtitle list remains clickable for seek; text selection uses native browser selection.
  - Rationale: Preserve current click-to-seek while enabling selection-driven lookup.

## Risks / Trade-offs
- Online dependency may fail or be rate-limited → Provide a deterministic error state and allow save without definition.
- Selection interaction can conflict with click-to-seek → Only trigger seek on explicit click, not during selection.

## Migration Plan
- Add a new optional `pronunciation` column to `vocab_items`.
- Backfill existing entries with `NULL` pronunciation.

## Open Questions
- Should the lookup panel show multiple senses or only the top definition?
