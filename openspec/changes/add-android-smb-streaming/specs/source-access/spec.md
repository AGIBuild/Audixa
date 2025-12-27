## MODIFIED Requirements

### Requirement: SMB source profiles
The system SHALL allow the user to configure and persist SMB connection profiles for browsing remote shares using **SMB2/SMB3**.

#### Scenario: User adds an SMB profile using UNC format
- **WHEN** the user inputs `\\host\share`, credentials, and enables "remember password"
- **THEN** the SMB profile SHALL be stored for future use
- **AND** the password SHALL be stored securely (not plaintext in SQLite)

#### Scenario: User adds an SMB profile using smb:// format
- **WHEN** the user inputs `smb://host/share`, credentials, and enables "remember password"
- **THEN** the SMB profile SHALL be stored for future use
- **AND** the password SHALL be stored securely (not plaintext in SQLite)

### Requirement: SMB browsing and opening
The system SHALL allow the user to browse SMB directories and open remote video files for playback using **SMB2/SMB3**.

#### Scenario: User opens an SMB video file
- **GIVEN** an SMB profile is configured
- **WHEN** the user selects a video file from an SMB directory listing
- **THEN** the system SHALL open the file as a seek-capable source suitable for streaming playback

#### Scenario: User seeks during SMB playback on Android
- **GIVEN** an SMB video is playing on Android
- **WHEN** the user seeks to an arbitrary position
- **THEN** playback SHALL continue from the requested position without requiring a full file download


