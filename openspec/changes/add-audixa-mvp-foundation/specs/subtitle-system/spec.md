## ADDED Requirements

### Requirement: External subtitle loading (SRT/VTT)
The system SHALL allow the user to load external subtitle files in SRT or VTT format.

#### Scenario: User loads a subtitle track
- **WHEN** the user selects an external subtitle file with extension `.srt` or `.vtt`
- **THEN** the system SHALL parse the subtitle into time-coded cues

### Requirement: Dual-track (bilingual) subtitles
The system SHALL support displaying two subtitle tracks simultaneously (Primary and Secondary).

#### Scenario: User loads bilingual subtitles as two tracks
- **GIVEN** a media item is loaded
- **WHEN** the user loads a Primary subtitle file and a Secondary subtitle file
- **THEN** the player SHALL display both tracks for the active cue

### Requirement: Subtitle click-to-seek
The system SHALL allow the user to click a subtitle line to seek playback to the start time of that line and resume playback.

#### Scenario: User clicks a subtitle line
- **GIVEN** subtitles are loaded
- **WHEN** the user clicks a subtitle cue in the list
- **THEN** playback SHALL seek to the cue start time
- **AND** playback SHALL start playing

### Requirement: Subtitle masking modes
The system SHALL provide subtitle masking modes: None, HidePrimary, HideSecondary, and Blind.

#### Scenario: User enables Blind mode
- **WHEN** the user selects masking mode `Blind`
- **THEN** both subtitle tracks SHALL be hidden in the player UI

### Requirement: Subtitle offset adjustment
The system SHALL allow per-track subtitle offset adjustment in milliseconds.

#### Scenario: User applies a +500ms offset
- **GIVEN** a subtitle track is loaded
- **WHEN** the user sets the track offset to +500ms
- **THEN** the active cue time mapping SHALL be shifted by +500ms


