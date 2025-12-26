## ADDED Requirements

### Requirement: Local source browsing
The system SHALL allow the user to browse and open local video files from device storage.

#### Scenario: User opens a local video file
- **WHEN** the user selects a local video file
- **THEN** the system SHALL create a media open request containing a display name and a playable source reference

### Requirement: SMB source profiles
The system SHALL allow the user to configure and persist SMB connection profiles for browsing remote shares.

#### Scenario: User adds an SMB profile
- **WHEN** the user inputs host, share, and credentials and saves the profile
- **THEN** the SMB profile SHALL be stored for future use

### Requirement: SMB browsing and opening
The system SHALL allow the user to browse SMB directories and open remote video files for playback.

#### Scenario: User opens an SMB video file
- **GIVEN** an SMB profile is configured
- **WHEN** the user selects a video file from an SMB directory listing
- **THEN** the system SHALL open the file as a seekable stream or equivalent seek-capable source


