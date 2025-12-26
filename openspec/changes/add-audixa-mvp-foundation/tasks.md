## 1. Implementation
- [ ] 1.1 Add DI container and app composition root (shared + platform adapters registration)
- [ ] 1.2 Build `Shell` navigation (Library / Player / Learning) with global overlays (Toast + MiniPlayer)
- [ ] 1.2.1 Implement MVP screens aligned with `docs/` prototypes (responsive adaptations allowed on mobile)
- [ ] 1.3 Define MVP domain models (MediaItem, SubtitleLine, Playlist, SavedSentence, VocabularyItem)
- [ ] 1.4 Define application service interfaces (`IPlaybackService`, `ISourceProvider`, `ISubtitleService`, `ILibraryStore`, `ILearningStore`, `INotificationService`)

## 2. Sources (MVP)
- [ ] 2.1 Local source: file picker + folder browsing + supported media filtering
- [ ] 2.2 SMB source: connection profiles, browse directories, open media as seekable stream
- [ ] 2.3 Normalize opened media into a `MediaOpenRequest` (source type, display name, stream/uri, optional subtitle hints)

## 3. Playback (MVP, platform-native adapters)
- [ ] 3.1 Android adapter: ExoPlayer integration + surface hosting + time events
- [ ] 3.2 iOS adapter: AVPlayer integration + surface hosting + time events
- [ ] 3.3 Desktop adapter spike: evaluate 2 approaches and pick one
  - [ ] A) WebView2 + in-app HTTP range streaming + JS bridge for currentTime
  - [ ] B) MediaFoundation/DirectShow native pipeline hosted via `NativeControlHost`
- [ ] 3.4 Implement `PlaybackService` (play/pause/seek/speed, state stream, error reporting)
- [ ] 3.5 Define `PlaybackInput` abstractions (direct uri, seekable stream, local http proxy) to enable future transcoding proxy without refactoring

## 4. Subtitles (MVP: external SRT/VTT only)
- [ ] 4.1 Implement SRT and VTT parsing (prefer OSS MIT/Apache library; fallback to minimal parser)
- [ ] 4.2 Support dual-track subtitles (Primary/Secondary) and per-track offset (ms)
- [ ] 4.3 Player UI: subtitle list virtualization, active line highlight, click-to-seek
- [ ] 4.4 Mask modes: None / HidePrimary / HideSecondary / Blind (UI-only for MVP)

## 5. Persistence (SQLite, sync-ready)
- [ ] 5.1 Add SQLite storage with schema versioning and migrations
- [ ] 5.2 Persist playback progress + recents
- [ ] 5.3 Persist saved sentences (linked to MediaItem + time range + text)
- [ ] 5.4 Persist vocabulary items (word + context + source)
- [ ] 5.5 Add change tracking primitives for future sync (UpdatedAt, Deleted, Outbox)

## 6. Learning Loop (MVP)
- [ ] 6.1 Learning page: stats cards (counts derived from local store)
- [ ] 6.2 Review pages: SavedSentences and Vocabulary list (basic browse/delete)

## 7. Quality & Packaging
- [ ] 7.1 Add unit tests for subtitle parsing + masking state machine
- [ ] 7.2 Add basic telemetry/logging for playback/source failures (no PII)
- [ ] 7.3 Validate Android + Windows packaging runs end-to-end


