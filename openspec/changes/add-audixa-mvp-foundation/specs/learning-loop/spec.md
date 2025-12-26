## ADDED Requirements

### Requirement: Saved sentences
The system SHALL allow the user to save the current subtitle sentence as a learning item linked to its media source and time range.

#### Scenario: User saves the current sentence
- **GIVEN** a media item and subtitles are loaded
- **WHEN** the user saves the current subtitle sentence
- **THEN** the saved sentence SHALL be persisted with media reference and cue timestamps

### Requirement: Vocabulary collection
The system SHALL allow the user to add a word to a vocabulary list with context.

#### Scenario: User adds a word to vocabulary
- **WHEN** the user adds a word from the current subtitle context
- **THEN** the vocabulary item SHALL be persisted with the source context

### Requirement: Learning dashboard
The system SHALL display a learning dashboard including counts for saved sentences and vocabulary items.

#### Scenario: Dashboard shows totals
- **GIVEN** the user has at least one saved sentence and one vocabulary item
- **WHEN** the user opens the Learning page
- **THEN** the dashboard SHALL show the totals


