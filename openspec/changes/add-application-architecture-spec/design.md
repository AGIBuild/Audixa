## Context
Audixa is a subtitle-first learning player across mobile (iOS/Android) and desktop (Windows/macOS). Playback must be native-grade, while UI and learning logic should be highly reusable cross-platform.

## Goals / Non-Goals
- Goals:
  - Establish a clear layered architecture and ownership boundaries.
  - Specify interop contracts between JS and native playback cores.
  - Define responsibilities for Subtitle Engine and Learning Engine.
- Non-Goals:
  - Implement any playback engine or UI in code as part of this change.
  - Decide the monorepo tool definitively (Turborepo vs Nx) in this change.

## Decisions
- Decision: Layered architecture (UI / Cross-platform Core / Native Playback Core).
  - Why: Keeps time-critical playback on native side while maximizing UI and learning logic reuse.
  - Alternatives considered:
    - All-in JS playback: rejected due to precision/performance constraints.
    - Full native UI per platform: rejected due to reduced reuse and higher iteration cost.
- Decision: RN Bare for mobile.
  - Why: Enables custom native modules and high-performance interop (JSI/TurboModules).
  - Alternatives considered: Expo managed workflow (rejected due to constraints around deep native integrations).
- Decision: Desktop shell preference is Tauri, with Electron as fallback.
  - Why: Smaller footprint and strong native integration story; keep Electron as contingency.

## Risks / Trade-offs
- Risk: JS/native event ordering issues cause subtitle drift.
  - Mitigation: Define explicit event timing guarantees and test them end-to-end.
- Risk: Over-abstracting early leads to slow iteration.
  - Mitigation: Keep capability spec focused on boundaries and contracts, not internal implementation details.

## Migration Plan
Not applicable (no existing specs or deployed behavior yet).

## Open Questions
- How frequently should time updates be delivered to JS, and what is the canonical clock?
- What is the minimal cross-platform interface for player commands/events?
- Which persistence model is required for learning records in phase 1 (SQLite vs per-platform storage)?
- When we add sync, what data is synced (events vs aggregated stats) and what privacy constraints apply?

