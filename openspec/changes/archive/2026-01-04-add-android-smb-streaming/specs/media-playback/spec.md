## MODIFIED Requirements

### Requirement: Normalized playback input
The system SHALL open media using a normalized playback input that can be either a direct URI/path, a seekable stream, or a local HTTP proxy URL.

#### Scenario: SMB media uses a seek-capable input on Android
- **GIVEN** the user selects a media item from an SMB source
- **WHEN** playback starts on Android
- **THEN** the playback adapter SHALL stream the media using a seek-capable input (supporting ExoPlayer seek/range reads)

#### Scenario: User seeks during SMB playback
- **GIVEN** SMB playback is active
- **WHEN** the user seeks to a different position
- **THEN** the playback adapter SHALL request data from the new offset and continue playback


