## 1. Architecture analysis & design deliverables
- [x] 1.1 Identify target platforms and constraints (mobile iOS/Android; desktop Windows/macOS).
- [x] 1.2 Define the layered architecture boundaries (UI / cross-platform core / native playback core).
- [x] 1.3 Define the core engines and responsibilities:
  - Subtitle Engine (formats, normalization, indexing, learning-driven state)
  - Learning Engine (events, persistence model, statistics)
- [x] 1.4 Define interop contracts between JS and native:
  - Commands (seek, loop, rate, track selection)
  - Events (time updates, buffering, errors)
  - Event ordering and timing guarantees
- [x] 1.5 Define package/module boundaries and ownership rules (monorepo layout, anti-duplication rules).
- [x] 1.6 Define storage strategy by phase (local-first; optional sync later) and data models at the boundary.
- [x] 1.7 Define performance budgets and measurement points (seek/loop latency, frame drops, subtitle sync drift).
- [x] 1.8 Define security/privacy constraints for future sync and analytics (no secrets in client; least privilege).

## 2. Spec updates
- [x] 2.1 Add `architecture` capability delta spec with requirements + scenarios.
- [x] 2.2 Add `design.md` with decisions, alternatives, and open questions.

## 3. Validation
- [x] 3.1 Run `openspec validate add-application-architecture-spec --strict --no-interactive` and fix any issues.

