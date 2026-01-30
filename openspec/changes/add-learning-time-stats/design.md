## Context
We need learning time metrics for recent windows and per resource, without maintaining lifetime totals.

## Goals / Non-Goals
- Goals:
  - Track active learning time during playback.
  - Report totals for today, last 7 days, last 30 days, and by media source.
  - Auto-delete session data older than 30 days.
- Non-Goals:
  - Lifetime totals or streaks.
  - Cross-device sync.

## Decisions
- Decision: Persist learning sessions as time slices.
  - Fields: id, mediaSourceId, startedAt, endedAt, durationSeconds.
- Decision: Accumulate only while playback is in "playing" state.
  - Rationale: Avoid counting pause/buffer time.
- Decision: Cleanup runs at app start and once per day during runtime.

## Risks / Trade-offs
- Small overhead from periodic writes → batch flush on pause/stop or every N seconds.
- Seek behavior can fragment sessions → acceptable; aggregation uses duration totals.

## Migration Plan
- Add a new `learning_sessions` table and index by `started_at`.
- Add cleanup query to delete records older than 30 days.

## Open Questions
- What UI location is best for the stats block (Listening vs Library screen)?
