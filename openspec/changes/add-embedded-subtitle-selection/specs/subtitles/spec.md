## ADDED Requirements

### Requirement: Embedded Subtitle Extraction
The system SHALL extract embedded subtitle tracks from a media file when available.

#### Scenario: Embedded subtitles present
- **WHEN** a media file contains embedded subtitle streams
- **THEN** the system extracts at least one track for display

### Requirement: Subtitle Fallback to External Files
The system SHALL fall back to same-name external subtitle files when embedded subtitles are not available.

#### Scenario: Embedded subtitles missing
- **WHEN** a media file has no embedded subtitle tracks
- **THEN** the system searches for external subtitle files with matching basename

### Requirement: Subtitle Selection
The system SHALL allow the user to choose a subtitle track or turn subtitles off.

#### Scenario: User selects a track
- **WHEN** the user opens subtitle selection
- **THEN** they can choose from embedded tracks, external files, or “Off”

### Requirement: Subtitle Masking
The system SHALL apply the existing subtitle masking rules to the selected subtitle track.

#### Scenario: Masking applied
- **WHEN** a subtitle track is displayed
- **THEN** the mask rules hide or blur lines based on the current mask state

### Requirement: WebDAV Subtitle Support
The system SHALL support external subtitle fallback for WebDAV media by downloading subtitle files to a local cache before parsing.

#### Scenario: WebDAV external subtitle
- **WHEN** a WebDAV media file has a matching external subtitle file
- **THEN** the system downloads it and displays its subtitles
