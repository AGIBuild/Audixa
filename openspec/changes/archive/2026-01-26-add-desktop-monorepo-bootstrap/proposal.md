# Change: Desktop-first monorepo bootstrap (Nx + pnpm)

## Prerequisites / Approval Order
- Approve `add-application-architecture-spec` first (architecture baseline and boundary ownership).
- Then approve this change (`add-desktop-monorepo-bootstrap`) to implement the Nx + pnpm workspace and desktop bootstrap aligned with that baseline.

## Why
Audixa needs a stable, maintainable foundation for long-term development. A desktop-first monorepo with enforced boundaries and reproducible tooling reduces architecture drift and keeps builds/test workflows consistent across apps and shared packages.

## What Changes
- Establish Nx as the monorepo orchestrator with pnpm workspaces as the package manager.
- Define a standard repository layout for desktop app and shared packages.
- Add an initial desktop app capability spec (Tauri + React) for the first runnable milestone.
- Define boundary rules to prevent duplication and enforce ownership (core vs UI vs app).

## Impact
- Affected specs:
  - `workspace` (new capability)
  - `desktop-app` (new capability)
- Affected code: none (spec/proposal only; implementation happens after approval)

