## ADDED Requirements
### Requirement: Burned-In Subtitle Detection
The system SHALL detect burned-in subtitles for video sources that do not have embedded or external subtitle tracks by analyzing sampled frames with OCR and selecting a stable text region.

#### Scenario: Burned-in subtitles detected
- **WHEN** a video source without embedded or external subtitles is loaded
- **THEN** the system SHALL analyze sampled frames and return a detected subtitle region or explicitly report that none was found

#### Scenario: OCR unavailable
- **WHEN** the OCR engine is missing or fails to run
- **THEN** the system SHALL report a detection error to the subtitle loading flow

### Requirement: OCR Engine Integration
The system SHALL use a bundled OCR engine to extract text and bounding boxes from sampled video frames.

#### Scenario: OCR extraction succeeds
- **WHEN** sampled frames are processed during burned-in detection
- **THEN** the system SHALL return bounding boxes used for stable-region selection

### Requirement: OCR Language Configuration
The system SHALL allow users to configure OCR languages used during burned-in subtitle detection.

#### Scenario: User sets OCR languages
- **WHEN** the user saves OCR languages in settings
- **THEN** the system SHALL use the configured languages for OCR detection

### Requirement: Online Subtitle Replacement
The system SHALL allow users to search OpenSubtitles and attach a selected subtitle as an external track when burned-in subtitles are detected.

#### Scenario: User selects an online subtitle
- **WHEN** the user selects a search result from OpenSubtitles
- **THEN** the system SHALL download the subtitle, cache it locally, and add it as a selectable subtitle track

### Requirement: Burned-In Mask Overlay
The system SHALL render a mask overlay over the detected burned-in region when an online subtitle track is active.

#### Scenario: Online subtitle track is active
- **WHEN** a burned-in region is detected and the user activates an online subtitle track
- **THEN** the system SHALL display the mask overlay aligned to the detected region
