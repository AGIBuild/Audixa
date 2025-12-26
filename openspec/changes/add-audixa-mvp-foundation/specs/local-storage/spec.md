## ADDED Requirements

### Requirement: SQLite local persistence
The system SHALL persist MVP user data in a local SQLite database.

#### Scenario: Database is initialized on first run
- **WHEN** the application starts for the first time
- **THEN** the SQLite database SHALL be created and migrated to the latest schema version

### Requirement: Playback progress and recents
The system SHALL persist playback progress (position and completion) and the recent media list.

#### Scenario: Resume from last position
- **GIVEN** the user previously played a media item
- **WHEN** the user opens the same media item again
- **THEN** the system SHALL offer resuming from the last saved position

### Requirement: Sync-ready entity metadata
All persisted entities SHALL include stable IDs and metadata suitable for future cloud sync, including `UpdatedAtUtc` and tombstones.

#### Scenario: Entity update increments UpdatedAtUtc
- **GIVEN** a vocabulary item exists
- **WHEN** the user edits the item
- **THEN** the item `UpdatedAtUtc` SHALL be updated

### Requirement: Local outbox for future sync
The system SHALL record local mutations into an append-only outbox for future synchronization.

#### Scenario: Adding a saved sentence writes an outbox record
- **WHEN** the user saves a sentence
- **THEN** an outbox record SHALL be written describing the mutation


