## ADDED Requirements
### Requirement: Learning Time Tracking
The system SHALL track learning time sessions while playback is actively playing and associate sessions with the media source.

#### Scenario: Start and stop session
- **WHEN** playback transitions from paused to playing
- **THEN** the system starts a learning time session

#### Scenario: Stop on pause or end
- **WHEN** playback pauses, stops, or the media source changes
- **THEN** the system ends the session and records its duration

### Requirement: Learning Time Reporting Windows
The system SHALL report learning time totals for today, last 7 days, last 30 days, and by media source.

#### Scenario: Report window totals
- **WHEN** the user opens the learning stats view
- **THEN** the system returns totals for today, last 7 days, and last 30 days

#### Scenario: Report by resource
- **WHEN** the user requests per-resource stats
- **THEN** the system returns learning time totals grouped by media source

### Requirement: Learning Time Retention
The system SHALL retain learning time sessions for the most recent 30 days only.

#### Scenario: Cleanup expired sessions
- **WHEN** the app performs scheduled cleanup
- **THEN** sessions older than 30 days are removed
