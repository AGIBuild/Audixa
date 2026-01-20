## 1. Repository bootstrap (after approval)
- [ ] 1.1 Initialize Nx workspace using pnpm workspaces.
- [ ] 1.2 Define standard layout:
  - `apps/desktop` (Tauri + React)
  - `packages/core` (domain engines and contracts)
  - `packages/ui` (shared UI components/theme)
  - `packages/utils` (shared utilities/types)
- [ ] 1.3 Configure root scripts to run per-target tasks consistently:
  - build, test, lint, typecheck
- [ ] 1.4 Configure boundary enforcement so apps depend on packages, and packages follow ownership rules.
- [ ] 1.5 Add CI task entrypoints (no implementation specifics required in this change).

## 2. Desktop app bootstrap (after approval)
- [ ] 2.1 Create desktop shell with Tauri and a React UI entry.
- [ ] 2.2 Add a minimal navigation structure and placeholder screens:
  - Library
  - Player
  - Listening Library (sentence collections)
  - Vocabulary
- [ ] 2.3 Define typed contracts for player commands/events (mock implementations allowed initially).
- [ ] 2.4 Ensure the desktop app can run in dev mode with a deterministic command.

## 3. Specs and design
- [ ] 3.1 Add `workspace` delta spec (tooling, tasks, boundaries).
- [ ] 3.2 Add `desktop-app` delta spec (desktop shell expectations).
- [ ] 3.3 Add `design.md` capturing decisions and alternatives.

## 4. Validation
- [ ] 4.1 Run `openspec validate add-desktop-monorepo-bootstrap --strict --no-interactive` and fix any issues.

