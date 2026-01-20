## ADDED Requirements

### Requirement: Desktop Shell (Tauri + React)
The system SHALL provide a desktop application implemented as a Tauri shell hosting a React UI.

#### Scenario: Developer can start the desktop app
- **WHEN** a developer runs the documented dev command
- **THEN** the desktop app launches successfully in development mode

### Requirement: Desktop Navigation Skeleton
The desktop app SHALL provide a minimal navigation skeleton for primary user workflows.

#### Scenario: Core screens exist as placeholders
- **WHEN** the desktop app starts
- **THEN** the UI includes placeholder routes/screens for Library, Player, Listening Library, and Vocabulary

### Requirement: Typed Player Contracts (Initial)
The desktop app SHALL define typed contracts for player commands and events suitable for later native playback integration.

#### Scenario: Commands and events are typed
- **WHEN** the UI issues playback control commands or consumes playback events
- **THEN** it does so through a typed contract exported from `packages/core`

