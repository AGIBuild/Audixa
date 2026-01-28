## MODIFIED Requirements
### Requirement: Word Tap Lookup
The system SHALL allow the user to tap or select a word within subtitle text to view its definition and pronunciation.

#### Scenario: Tap a tokenized word
- **WHEN** the user taps a word token in a subtitle sentence
- **THEN** the system displays a lookup panel for that word

#### Scenario: Select a word in subtitle list
- **WHEN** the user selects a word in the subtitle list text
- **THEN** the system displays a lookup panel for the selected word

#### Scenario: Show definition and pronunciation
- **WHEN** the lookup panel is shown
- **THEN** it includes at least a definition and a pronunciation representation for the word

### Requirement: Lookup Provider Selection and Fallback
The system SHALL use an online dictionary provider for desktop lookups and SHALL surface a deterministic fallback state when the provider is unavailable.

#### Scenario: Online lookup success
- **WHEN** the device is online and a word is selected
- **THEN** the system returns definitions and pronunciation from the provider

#### Scenario: Offline lookup fallback
- **WHEN** the device is offline or the provider request fails
- **THEN** the system returns a deterministic "lookup unavailable" state

## ADDED Requirements
### Requirement: Vocabulary Entry Enrichment
The system SHALL store lookup definitions and pronunciations with vocabulary entries when available.

#### Scenario: Store lookup fields on add
- **WHEN** the user adds a looked-up word to the vocabulary list
- **THEN** the entry stores definition and pronunciation if present
