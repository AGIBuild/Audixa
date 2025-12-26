## ADDED Requirements

### Requirement: Prototype-aligned UX for MVP
The MVP UI/UX SHALL be implemented aligned with the provided prototype HTML under `docs/`:
- `docs/audixa_prototype.html` (overall flow)
- `docs/audixa_home.html` (Library / sources / recents)
- `docs/audixa_player.html` (Player / subtitles / controls)
- `docs/audixa_playlist.html` (Queue / playlists)
- `docs/audixa_review.html` (Learning / review)
- `docs/audixa_notifications.html` (toasts / top alert / mini player)

#### Scenario: Desktop follows prototype layout and interactions
- **WHEN** the application runs on Desktop
- **THEN** the Shell navigation structure and core Player layout SHALL follow the prototype screens and interactions

#### Scenario: Mobile adapts layout but preserves interactions
- **WHEN** the application runs on a mobile form factor
- **THEN** the UI MAY adapt layout (e.g., sidebar becomes a drawer/bottom sheet)
- **AND** the core interactions SHALL remain available (click subtitle -> seek, masking toggle, AB loop, saved sentence)


