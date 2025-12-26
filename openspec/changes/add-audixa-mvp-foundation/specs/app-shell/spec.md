## ADDED Requirements

### Requirement: Shell navigation
The application SHALL provide a Shell UI that allows navigation between Library, Player, and Learning.

#### Scenario: User navigates between top-level pages
- **WHEN** the user selects `Library`
- **THEN** the Library page SHALL be displayed
- **WHEN** the user selects `Player`
- **THEN** the Player page SHALL be displayed
- **WHEN** the user selects `Learning`
- **THEN** the Learning page SHALL be displayed

### Requirement: Global mini player overlay
The application SHALL display a mini player overlay outside the Player page when a media item has been loaded.

#### Scenario: Mini player is visible when media is loaded
- **GIVEN** a media item is loaded in the playback service
- **WHEN** the user navigates to Library
- **THEN** the mini player SHALL be visible

### Requirement: In-app notifications
The application SHALL provide in-app notifications including transient toasts and persistent top alerts for critical errors.

#### Scenario: Playback failure shows a top alert
- **WHEN** a playback error occurs (e.g., media cannot be opened)
- **THEN** a top alert SHALL be shown describing the error

### Requirement: Prototype-aligned shell structure
The application SHALL align the top-level structure and navigation labels with the provided prototypes under `docs/`.

#### Scenario: Library/Player/Learning are discoverable from Shell
- **WHEN** the user opens the application
- **THEN** the Shell SHALL present navigation entries consistent with the prototypes for Library, Player, and Learning


