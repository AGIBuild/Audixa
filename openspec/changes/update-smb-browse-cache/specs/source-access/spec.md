## MODIFIED Requirements

### Requirement: SMB browsing (MVP)
The app SHALL support browsing SMB sources on supported platforms.

#### Scenario: List directory with caching
- **WHEN** the user lists the same SMB directory repeatedly
- **THEN** the app SHOULD reuse a recent cached listing to reduce redundant network calls

#### Scenario: User forces refresh
- **WHEN** the user triggers a manual refresh for the current SMB directory
- **THEN** the app SHALL bypass the cache and fetch a fresh listing

#### Scenario: Cache expiry
- **WHEN** the cached listing for an SMB directory is older than the configured TTL
- **THEN** the app SHALL fetch a fresh listing and update the cache


