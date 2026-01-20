## ADDED Requirements

### Requirement: Layered Architecture
The system SHALL be organized into three layers: UI Layer, Cross-platform Core, and Native Playback Core, with clear ownership boundaries between layers.

#### Scenario: UI consumes core outputs only
- **WHEN** a UI feature needs subtitle sentences, learning state, or player state
- **THEN** it reads them from the Cross-platform Core public interfaces

#### Scenario: Time-critical playback stays native
- **WHEN** the user performs time-critical playback actions (seek, loop, rate change)
- **THEN** the UI issues commands to the Native Playback Core via a defined interop boundary

### Requirement: Canonical Playback Clock
The system SHALL define a canonical playback clock sourced from the Native Playback Core, and all subtitle synchronization SHALL reference that clock in milliseconds.

#### Scenario: Subtitle sync uses native time
- **WHEN** the UI needs the current playback time to render subtitles
- **THEN** it uses the canonical time provided by the Native Playback Core rather than local JS timers

### Requirement: Time Update Frequency and Guarantees
The system SHALL specify the time update cadence and guarantees (frequency, jitter tolerance, and delivery semantics) from native to JS.

#### Scenario: Predictable time update stream
- **WHEN** playback is running normally
- **THEN** time updates are emitted at a configured cadence with documented jitter tolerance

### Requirement: Seek and Loop Precision
The system SHALL specify precision targets for seek and A/B loop boundaries in milliseconds and validate them across platforms.

#### Scenario: Seek lands within tolerance
- **WHEN** a seek is issued to time T
- **THEN** the native playback position settles within the documented tolerance of T

#### Scenario: Loop honors boundaries
- **WHEN** an A/B loop is enabled with boundaries [A, B]
- **THEN** playback repeats within the documented boundary tolerance and does not drift unbounded over time

### Requirement: Subtitle Drift Budget
The system SHALL define a maximum acceptable subtitle-to-audio drift budget and enforce synchronization behavior to remain within that budget during normal playback.

#### Scenario: Drift stays within budget
- **WHEN** playback runs continuously and subtitles are rendered from the sentence model
- **THEN** displayed subtitles remain within the drift budget relative to the canonical playback clock

### Requirement: JS/Native Interop Contract
The system SHALL define explicit commands and events across the JS/native boundary, including event ordering and timing guarantees for time updates.

#### Scenario: Command interface
- **WHEN** the UI requests a seek to a specific time in milliseconds
- **THEN** the native layer receives a single seek command with the requested time and applies it

#### Scenario: Event ordering guarantee
- **WHEN** the native layer emits time updates and state changes (buffering, ended, error)
- **THEN** they are delivered to JS in a deterministic order defined by the contract

### Requirement: Interop Command Serialization
The system SHALL define how concurrent commands are serialized (e.g., seek + rate change + loop enable) and what the last-write-wins rules are.

#### Scenario: Deterministic command resolution
- **WHEN** multiple playback commands are issued in quick succession
- **THEN** the native layer applies them in a deterministic, documented order or policy

### Requirement: Error Surface and Recovery Semantics
The system SHALL define a standard error surface from native playback to JS (error codes, messages, and recoverability flags).

#### Scenario: Recoverable error is actionable
- **WHEN** a recoverable playback error occurs (e.g., transient network failure)
- **THEN** the UI receives an error event with a recoverable indicator and recommended action category

### Requirement: Subtitle Engine Sentence Model
The system SHALL represent subtitles as a normalized sentence model with stable identifiers and millisecond timestamps suitable for sentence-level interactions.

#### Scenario: Normalize loaded subtitle formats
- **WHEN** subtitles are loaded from SRT, VTT, or ASS
- **THEN** they are parsed and normalized into an ordered list of sentence records with startMs and endMs

#### Scenario: Time index lookup
- **WHEN** the current playback time (ms) is provided
- **THEN** the subtitle engine returns the active sentence for that time range

### Requirement: Learning Engine Event Capture
The system SHALL capture learning-relevant user interactions (e.g., sentence seeks, loops, masking toggles) as events and produce aggregations for learning statistics.

#### Scenario: Record sentence-level seek
- **WHEN** a user taps a subtitle sentence to seek
- **THEN** a learning event is recorded referencing the target sentence identifier and timestamp

### Requirement: Storage Boundary for Learning Data
The system SHALL define the persistence boundary for learning data (events vs aggregates) and ensure local-first behavior for phase 1.

#### Scenario: Local-first persistence
- **WHEN** the user generates learning events during playback
- **THEN** they are persisted locally without requiring a network connection

### Requirement: Privacy and Data Minimization
The system SHALL minimize data collection by default and define what data may leave the device in future sync/analytics phases.

#### Scenario: No implicit external export
- **WHEN** the user uses local playback and learning features
- **THEN** learning records are not exported off-device unless an explicit sync feature is enabled

### Requirement: Module Ownership and No-Duplication Rule
The system SHALL enforce module ownership such that a capability is implemented in exactly one place (e.g., subtitle parsing/indexing in Subtitle Engine) and not duplicated across UI modules.

#### Scenario: Subtitle parsing is not re-implemented in UI
- **WHEN** a UI module needs subtitle sentences or indexing
- **THEN** it calls the Subtitle Engine interfaces rather than re-parsing subtitle files itself

### Requirement: Observability for Playback and Subtitle Sync
The system SHALL expose basic observability signals for playback and subtitle synchronization (key events and timings) to support debugging and performance validation.

#### Scenario: Measure seek and drift
- **WHEN** a seek or loop operation occurs
- **THEN** the system records timing signals sufficient to compute seek latency and subtitle drift metrics

### Requirement: Cross-Platform Validation Coverage
The system SHALL define cross-platform validation coverage for the interop contract and synchronization behavior.

#### Scenario: Contract behavior is tested per platform
- **WHEN** a platform implementation changes (iOS/Android/Desktop)
- **THEN** contract tests validate command/event semantics and timing assumptions for that platform
