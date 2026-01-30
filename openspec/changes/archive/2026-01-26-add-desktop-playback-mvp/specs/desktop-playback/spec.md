## ADDED Requirements

### Requirement: Desktop Playback MVP
The system SHALL play imported local media in the desktop app using an HTML media element.

#### Scenario: Play imported media
- **WHEN** the user selects an imported media source and presses Play
- **THEN** playback starts and audio/video output is produced

### Requirement: Playback Adapter Boundary
The system SHALL provide a single playback adapter module that owns the media element and exposes commands and events to the UI.

#### Scenario: UI uses adapter commands
- **WHEN** the user presses play, pause, seek, or rate change
- **THEN** the UI issues commands through the playback adapter rather than directly manipulating the media element

### Requirement: Local File URL Conversion
The system SHALL convert local file paths to webview-safe URLs before assigning them to the media element source.

#### Scenario: Load local file source
- **WHEN** a local file path is selected for playback
- **THEN** the adapter converts it and assigns the resulting URL to the media element

### Requirement: Playback Progress Updates
The system SHALL surface current time and duration updates suitable for the Player timeline.

#### Scenario: Timeline updates during playback
- **WHEN** playback is running
- **THEN** the timeline progress reflects the current playback position

### Requirement: Deterministic Playback Errors
The system SHALL surface a deterministic error state when the media element fails to load.

#### Scenario: File cannot be loaded
- **WHEN** the media file is missing or cannot be decoded
- **THEN** the UI displays an error state indicating playback failure
