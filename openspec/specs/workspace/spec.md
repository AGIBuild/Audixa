# workspace Specification

## Purpose
TBD - created by archiving change add-desktop-monorepo-bootstrap. Update Purpose after archive.
## Requirements
### Requirement: Nx Workspace with pnpm
The project SHALL use Nx as the monorepo orchestrator and pnpm as the package manager for all workspace packages and applications.

#### Scenario: Single package manager
- **WHEN** a developer installs dependencies
- **THEN** they use pnpm as the only supported package manager for the workspace

#### Scenario: Nx runs workspace tasks
- **WHEN** a developer runs build/test/lint/typecheck
- **THEN** tasks are executed via Nx targets for the relevant projects

### Requirement: Standard Repository Layout
The repository SHALL follow a standard layout that separates applications from reusable packages.

#### Scenario: Apps and packages are separate
- **WHEN** new code is added
- **THEN** application code lives under `apps/` and reusable code lives under `packages/`

### Requirement: Boundary Enforcement
The system SHALL enforce dependency boundaries to prevent architecture drift and duplicated implementations.

#### Scenario: Packages do not depend on apps
- **WHEN** a package is authored under `packages/`
- **THEN** it MUST NOT depend on code in `apps/`

#### Scenario: UI does not own domain engines
- **WHEN** a UI component needs subtitle or learning domain behavior
- **THEN** it consumes `packages/core` interfaces rather than implementing its own engine logic

### Requirement: Architecture Layer Boundaries
The system SHALL define module boundary rules that reflect the layered architecture (UI / Cross-platform Core / Native Playback Core) and prevent reverse dependencies.

#### Scenario: Core does not depend on UI
- **WHEN** a module is part of the Cross-platform Core
- **THEN** it MUST NOT depend on UI-layer packages or app code

#### Scenario: Apps depend on packages only
- **WHEN** a module is part of an app under `apps/`
- **THEN** it MAY depend on `packages/core`, `packages/ui`, and `packages/utils` but MUST NOT depend on other apps

### Requirement: Deterministic Workspace Commands
The workspace SHALL provide deterministic commands for common workflows (build/test/lint/typecheck) suitable for CI execution.

#### Scenario: CI can run without prompts
- **WHEN** CI executes workspace commands
- **THEN** commands run non-interactively and produce deterministic exit codes

