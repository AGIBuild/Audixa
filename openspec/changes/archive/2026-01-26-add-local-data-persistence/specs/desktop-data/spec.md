## ADDED Requirements

### Requirement: Desktop Local Data Store
The system SHALL persist desktop media library data and learning data in a single local database.

#### Scenario: Data survives restart
- **WHEN** the user closes and reopens the desktop app
- **THEN** previously saved sources, recents, listening items, and vocabulary entries are still available

### Requirement: Deterministic Store Location
The system SHALL store the database in the Tauri application data directory with a fixed, documented filename.

#### Scenario: Storage path is predictable
- **WHEN** the data store initializes
- **THEN** it resolves the same storage path for the current user profile on every launch

### Requirement: Schema Versioning and Migration
The system SHALL version the schema and apply forward-only migrations before UI data access.

#### Scenario: App upgrades safely
- **WHEN** a newer app version starts with an older local database
- **THEN** migrations run before repositories load data and no data loss occurs

### Requirement: Media Source Persistence
The system SHALL persist media sources with stable identifiers and minimal metadata (title, uri, kind, timestamps).

#### Scenario: Import local media
- **WHEN** the user imports a local media file
- **THEN** a media source record is created and appears in the Library screen

### Requirement: Recent Playback Tracking
The system SHALL upsert recent playback entries with progress and timestamps when playback stops.

#### Scenario: Update recents after playback
- **WHEN** the user stops playback or exits a media item
- **THEN** the corresponding recent entry is created or updated with the latest progress

### Requirement: Subtitle Track References
The system SHALL persist subtitle track references linked to media sources.

#### Scenario: Attach a subtitle file
- **WHEN** the user links an external subtitle file to a media source
- **THEN** the subtitle track reference is stored and available on the next launch

### Requirement: Listening Item Persistence
The system SHALL persist listening items with media references and sentence time boundaries (startMs, endMs).

#### Scenario: Save a sentence
- **WHEN** the user saves the current subtitle sentence
- **THEN** a listening item is stored with its media reference and time boundaries

### Requirement: Vocabulary Entry Deduplication
The system SHALL canonicalize and deduplicate vocabulary entries by locale and canonical word.

#### Scenario: Add a duplicate word
- **WHEN** the user adds a word already in the vocabulary list
- **THEN** the existing entry is updated (e.g., lastSeenAt) without creating a duplicate

### Requirement: Repository Access Layer
The system SHALL provide a single repository interface for reading and writing desktop data, and UI modules SHALL use it instead of static mocks.

#### Scenario: UI loads from repository
- **WHEN** the desktop app loads Library, Listening, or Vocabulary screens
- **THEN** the data is sourced from the repository layer rather than `data.ts`
