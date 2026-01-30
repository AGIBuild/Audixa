# architecture Specification

## Purpose
TBD - created by archiving change add-application-architecture-spec. Update Purpose after archive.
## Requirements
### Requirement: Supported Platforms
The system SHALL support the following target platforms for phase 1: iOS, Android, Windows, and macOS.

#### Scenario: Platform support is explicit
- **WHEN** a new feature or dependency is proposed
- **THEN** it declares which of the target platforms are supported and any platform-specific constraints

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
- **THEN** time updates are emitted at a configured cadence of **every 50ms (20Hz)** with a documented jitter tolerance of **<= 20ms**, and each update includes a monotonically increasing sequence number

#### Scenario: On-demand time query
- **WHEN** JS needs to align rendering to the canonical clock outside the periodic update cadence
- **THEN** it can request the current canonical playback time from the Native Playback Core and receive a value in milliseconds

### Requirement: Seek and Loop Precision
The system SHALL specify precision targets for seek and A/B loop boundaries in milliseconds and validate them across platforms.

#### Scenario: Seek lands within tolerance
- **WHEN** a seek is issued to time T
- **THEN** the native playback position settles within **±50ms** of T within a target of **<= 250ms (p95)** for local media

#### Scenario: Loop honors boundaries
- **WHEN** an A/B loop is enabled with boundaries [A, B]
- **THEN** playback repeats within a boundary tolerance of **±40ms** at A and B and does not drift unbounded over time

### Requirement: Subtitle Drift Budget
The system SHALL define a maximum acceptable subtitle-to-audio drift budget and enforce synchronization behavior to remain within that budget during normal playback.

#### Scenario: Drift stays within budget
- **WHEN** playback runs continuously and subtitles are rendered from the sentence model
- **THEN** displayed subtitles remain within a drift budget of **<= 80ms (p95)** relative to the canonical playback clock

### Requirement: JS/Native Interop Contract
The system SHALL define explicit commands and events across the JS/native boundary, including event ordering and timing guarantees for time updates.

#### Scenario: Command interface
- **WHEN** the UI requests a seek to a specific time in milliseconds
- **THEN** the native layer receives a single seek command with the requested time and applies it

#### Scenario: Minimum command set is defined
- **WHEN** the interop boundary is specified for phase 1
- **THEN** it defines at minimum the following commands with explicit payload schemas:
  - `load(mediaRef, initialTrackSelection?)`
  - `play()`, `pause()`
  - `seek(toMs)`
  - `setRate(rate)`
  - `setLoop({ aMs, bMs, enabled })`
  - `selectTrack({ audioTrackId?, subtitleTrackId? })`
  - `setSubtitleOffsetMs(offsetMs)`

#### Scenario: Event ordering guarantee
- **WHEN** the native layer emits time updates and state changes (buffering, ended, error)
- **THEN** they are delivered to JS in a deterministic order defined by the contract

#### Scenario: Minimum event set is defined
- **WHEN** the interop boundary is specified for phase 1
- **THEN** it defines at minimum the following events with explicit payload schemas:
  - `time({ nowMs, seq })`
  - `state({ status, bufferedRanges?, rate?, selectedTracks? })`
  - `buffering({ isBuffering })`
  - `ended()`
  - `error({ code, message, recoverable, category })`
  - `seeked({ toMs, settledMs })`
  - `tracksChanged({ audioTracks, subtitleTracks, selected })`

### Requirement: Interop Command Serialization
The system SHALL define how concurrent commands are serialized (e.g., seek + rate change + loop enable) and what the last-write-wins rules are.

#### Scenario: Deterministic command resolution
- **WHEN** multiple playback commands are issued in quick succession
- **THEN** the native layer applies them on a single playback command queue in arrival order, and **multiple `seek()` commands collapse to last-write-wins** before execution

#### Scenario: Seek establishes a new time base
- **WHEN** a `seek(toMs)` is applied
- **THEN** subsequent `time` events reflect the new canonical clock position, and a `seeked({ toMs, settledMs })` event is emitted before the next periodic `time` event

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

### Requirement: Storage Strategy by Phase
The system SHALL define a storage strategy by phase: phase 1 is local-first with a single-writer local store; a future phase may add optional sync with explicit user enablement.

#### Scenario: Phase 1 uses a single local store abstraction
- **WHEN** learning-related data (events, collections, vocabulary) is persisted in phase 1
- **THEN** it flows through a single Cross-platform Core storage abstraction (backed by a platform-appropriate local database such as SQLite), rather than ad-hoc per-feature persistence

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

### Requirement: Package / Module Boundaries
The system SHALL define package/module boundaries and ownership rules such that each layer and engine has a clear public interface and a single implementation owner.

#### Scenario: Cross-platform Core is the shared logic boundary
- **WHEN** business logic is shared across iOS/Android/Desktop
- **THEN** it lives in the Cross-platform Core packages/modules and is consumed by platform UIs via public interfaces only

#### Scenario: Native Playback Core is platform-owned
- **WHEN** code depends on platform media APIs, decoding, or rendering timing
- **THEN** it lives in the Native Playback Core for that platform and is not implemented in the Cross-platform Core

### Requirement: Performance Budgets and Measurement Points
The system SHALL define performance budgets and measurement points for critical user actions (seek, loop) and sync correctness (subtitle drift), and SHALL expose measurements via observability signals.

#### Scenario: Budgets are measurable
- **WHEN** a seek, loop boundary hit, or subtitle render decision occurs
- **THEN** the system records timestamps needed to compute: seek latency, loop boundary latency, and subtitle drift versus the canonical clock

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

