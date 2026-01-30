## 1. Repository bootstrap (after approval)
- [x] 1.1 Initialize Nx workspace using pnpm workspaces.
- [x] 1.2 Define standard layout:
  - `apps/desktop` (Tauri + React)
  - `packages/core` (domain engines and contracts)
  - `packages/ui` (shared UI components/theme)
  - `packages/utils` (shared utilities/types)
- [x] 1.3 Configure root scripts to run per-target tasks consistently:
  - build, test, lint, typecheck
- [x] 1.4 Configure boundary enforcement so apps depend on packages, and packages follow ownership rules.
- [x] 1.5 Add CI task entrypoints (no implementation specifics required in this change).

## 2. Desktop app bootstrap (after approval)
- [x] 2.1 Create desktop shell with Tauri and a React UI entry.
- [x] 2.2 Add a minimal navigation structure and placeholder screens:
  - Library
  - Player
  - Listening Library (sentence collections)
  - Vocabulary
- [x] 2.3 Define typed contracts for player commands/events (mock implementations allowed initially).
- [x] 2.4 Ensure the desktop app can run in dev mode with a deterministic command.

## 3. Specs and design
- [x] 3.1 Add `workspace` delta spec (tooling, tasks, boundaries).
- [x] 3.2 Add `desktop-app` delta spec (desktop shell expectations).
- [x] 3.3 Add `design.md` capturing decisions and alternatives.

## 4. Validation
- [x] 4.1 Run `openspec validate add-desktop-monorepo-bootstrap --strict --no-interactive` and fix any issues.

