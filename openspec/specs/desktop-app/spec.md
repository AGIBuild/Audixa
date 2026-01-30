# desktop-app Specification

## Purpose
TBD - created by archiving change add-desktop-monorepo-bootstrap. Update Purpose after archive.
## Requirements
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

#### Scenario: Contract aligns with architecture interop
- **WHEN** the player contract is defined for phase 1
- **THEN** it includes at minimum:
  - Commands: `load`, `play`, `pause`, `seek`, `setRate`, `setLoop`, `selectTrack`, `setSubtitleOffsetMs`
  - Events: `time`, `state`, `buffering`, `seeked`, `tracksChanged`, `ended`, `error`

### Requirement: Native Playback Boundary (Desktop)
The desktop app SHALL preserve a Native Playback Core boundary in the Tauri host (Rust) even if the initial implementation is mocked.

#### Scenario: JS interacts only through the contract
- **WHEN** the React UI needs playback data or control
- **THEN** it interacts with the Native Playback Core via the typed contract rather than direct platform APIs

