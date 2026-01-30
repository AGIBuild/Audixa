## ADDED Requirements
### Requirement: Learning Session Persistence
The system SHALL persist learning sessions with timestamps and duration in the desktop database.

#### Scenario: Save a session
- **WHEN** a learning time session ends
- **THEN** the data store writes a session record linked to the media source

### Requirement: Learning Session Cleanup
The system SHALL delete learning session records older than 30 days.

#### Scenario: Cleanup on startup
- **WHEN** the desktop app starts
- **THEN** the data store deletes sessions older than 30 days before stats load
