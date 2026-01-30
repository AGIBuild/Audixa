# learning-engine Specification

## Purpose
TBD - created by archiving change add-application-architecture-spec. Update Purpose after archive.
## Requirements
### Requirement: Sentence Collection (Listening Library)
The system SHALL allow the user to save the current subtitle sentence as a collection item with its associated audio segment and subtitle metadata, forming a curated listening library.

#### Scenario: One-tap save current sentence
- **WHEN** the user taps "Save sentence" on the currently active subtitle sentence
- **THEN** the system creates a collection item referencing that sentence and media source

#### Scenario: Collection item includes audio segment boundaries
- **WHEN** a sentence is saved
- **THEN** the collection item stores the sentence start and end timestamps in milliseconds for replay

#### Scenario: Replay uses stored boundaries
- **WHEN** the user plays a saved collection item
- **THEN** the player replays the audio segment bounded by the stored timestamps

### Requirement: Listening Library Organization
The system SHALL provide a listening library list view composed of saved sentence collection items, suitable for repeated listening workflows.

#### Scenario: View listening library
- **WHEN** the user opens the listening library
- **THEN** the system displays saved items in a stable order with minimal metadata (sentence text and source)

### Requirement: Word Tap Lookup
The system SHALL allow the user to tap a word within subtitle text to view its definition and pronunciation.

#### Scenario: Tap a tokenized word
- **WHEN** the user taps a word token in a subtitle sentence
- **THEN** the system displays a lookup panel for that word

#### Scenario: Show definition and pronunciation
- **WHEN** the lookup panel is shown
- **THEN** it includes at least a definition and a pronunciation representation for the word

### Requirement: Vocabulary List (Wordbook)
The system SHALL allow the user to add a looked-up word to a vocabulary list for later review.

#### Scenario: Add a word from lookup
- **WHEN** the user taps "Add to vocabulary" in the lookup panel
- **THEN** the word is stored as a vocabulary entry

#### Scenario: Prevent duplicate entries
- **WHEN** the user adds a word that already exists in the vocabulary list
- **THEN** the system does not create a duplicate entry and provides deterministic behavior (e.g., update last-seen time)

### Requirement: Local-First Learning Data
The system SHALL persist sentence collections and vocabulary entries locally, without requiring a network connection for creation.

#### Scenario: Save sentence offline
- **WHEN** the device is offline
- **THEN** saving a sentence still creates a local collection item successfully

#### Scenario: Add vocabulary offline
- **WHEN** the device is offline
- **THEN** adding a word to vocabulary still creates a local vocabulary entry successfully

### Requirement: Collection Item Media Reference
The system SHALL define how a collection item references its underlying media (e.g., local file, NAS, or URL) such that the saved sentence can be replayed deterministically.

#### Scenario: Persist a stable media reference
- **WHEN** a sentence is saved from a media source
- **THEN** the collection item stores a stable media reference sufficient to locate and replay the segment later

### Requirement: Audio Segment Availability Policy
The system SHALL define an availability policy for replaying a saved sentence segment when the underlying media is not currently accessible.

#### Scenario: Media unavailable at replay time
- **WHEN** the user attempts to replay a collection item but the referenced media cannot be accessed
- **THEN** the UI receives a deterministic failure state indicating the segment is unavailable

### Requirement: Optional Audio Segment Caching
The system SHALL allow an implementation option to cache the audio segment for a saved sentence, and SHALL document whether caching is enabled and its storage limits.

#### Scenario: Cache segment on save (optional)
- **WHEN** caching is enabled and a sentence is saved
- **THEN** the system stores an audio cache entry for the segment under documented storage limits

### Requirement: Lookup Provider Selection and Fallback
The system SHALL define at least one lookup provider for word definitions/pronunciation and SHALL define fallback behavior (e.g., offline mode).

#### Scenario: Offline lookup fallback
- **WHEN** the device is offline and the user taps a word
- **THEN** the system either serves results from a local provider or returns a deterministic "not available offline" state

### Requirement: Vocabulary Entry Canonicalization
The system SHALL define how vocabulary entries are canonicalized for deduplication (e.g., case folding and locale/language boundaries).

#### Scenario: Deduplicate by canonical form
- **WHEN** the user adds words that normalize to the same canonical form in the same language/locale scope
- **THEN** the system stores a single vocabulary entry and updates deterministic metadata (e.g., lastSeenAt)

### Requirement: Vocabulary Entry Minimum Fields
The system SHALL store minimum vocabulary entry fields needed for review workflows, including a stable identifier and timestamps.

#### Scenario: Store required fields on add
- **WHEN** a word is added to the vocabulary list
- **THEN** the stored entry includes at least: id, language/locale, display text, createdAt, and lastSeenAt

