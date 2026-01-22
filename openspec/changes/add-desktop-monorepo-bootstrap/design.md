## Context
Audixa is desktop-first initially. The project will grow into a multi-app, multi-package codebase (desktop + mobile + shared engines/UI). The repo currently contains OpenSpec documents but no implementation scaffolding.

## Goals / Non-Goals
- Goals:
  - Use an industry-standard monorepo approach with strong maintainability guarantees.
  - Standardize task execution (build/test/lint/typecheck) and reduce drift across apps/packages.
  - Enforce module boundaries to preserve the layered architecture defined in `architecture`.
  - Bootstrap a minimal desktop app shell (Tauri + React) as the first runnable artifact.
- Non-Goals:
  - Build the full native playback core or subtitle engine in this change proposal.
  - Finalize mobile bootstrapping (to be proposed separately).

## Decisions
- Decision: Nx for monorepo orchestration.
  - Why: Provides dependency graph awareness, task orchestration, caching, generators, and boundary enforcement suitable for long-lived codebases.
  - Alternatives considered:
    - Turborepo: simpler, but boundary governance and workspace discipline require more bespoke enforcement.
- Decision: pnpm as the package manager.
  - Why: Works well with large monorepos (workspace support, fast installs, reduced duplication).
  - Alternatives considered: yarn, npm.
- Decision: Desktop app uses Tauri + React.
  - Why: Aligns with the desktop strategy while keeping UI and shared packages in TypeScript/React.

## Repository Layout
- `apps/desktop`: Tauri + React desktop app
- `packages/core`: cross-platform engines and contracts
- `packages/ui`: shared UI components and theme
- `packages/utils`: shared utilities/types

## Architecture Alignment
- Enforce the layered boundary from `architecture` via Nx module rules (UI / Cross-platform Core / Native Playback Core).
- Keep player contracts in `packages/core` as the single source of truth for JS/native interop.
- Treat the Tauri host (Rust) as the Native Playback Core boundary for desktop, even if mocked initially.

## Boundary Rules (high level)
- Apps may depend on packages; packages should not depend on apps.
- UI should not implement domain engines; it consumes `packages/core` interfaces.
- Core is the single owner of subtitle/learning models and contracts.

## Risks / Trade-offs
- Risk: Nx introduces upfront configuration complexity.
  - Mitigation: Keep the initial workspace minimal and add plugins/rules incrementally.
- Risk: Desktop-first may bias architectural choices.
  - Mitigation: Keep contracts in `packages/core` cross-platform and avoid desktop-only assumptions.

## Migration Plan
Not applicable (initial bootstrap).

## Open Questions
- Which Nx plugins are required for the first phase (minimal set)?
- Should desktop use Vite for the React dev build (likely) and how do we standardize tooling across packages?
- Do we need strict module boundary tagging from day one, or phase it in?

