## ADDED Requirements

### Requirement: Video playback controls
The system SHALL provide video playback controls including play, pause, seek, and playback speed adjustment.

#### Scenario: User changes playback speed
- **GIVEN** a media item is loaded
- **WHEN** the user sets playback speed to 1.5x
- **THEN** the player SHALL play at 1.5x speed

### Requirement: Normalized playback input
The system SHALL open media using a normalized playback input that can be either a direct URI/path, a seekable stream, or a local HTTP proxy URL.

#### Scenario: SMB media uses a seekable stream input
- **GIVEN** the user selects a media item from an SMB source
- **WHEN** playback is started
- **THEN** the playback service SHALL open the item using a seek-capable input

### Requirement: Playback state as a single source of truth
The system SHALL expose playback state (current item, position, duration, speed, and error state) from a single service to all UI pages.

#### Scenario: Mini player reflects current position
- **GIVEN** playback is running
- **WHEN** playback position changes
- **THEN** the mini player UI SHALL display the updated position

### Requirement: Platform-native playback adapters
The system SHALL use platform-native playback implementations behind a common adapter abstraction.

#### Scenario: Android uses ExoPlayer adapter
- **WHEN** the application runs on Android
- **THEN** the playback adapter implementation SHALL use ExoPlayer


