# Change: Android SMB2/SMB3 streaming playback + secure remembered credentials

## Why
The MVP requires SMB access on Android with true streaming playback (including seek) and a "remember password" experience. The current codebase only supports SMB browsing via local filesystem APIs (works for Windows UNC but not Android), and has no secure credential persistence.

## What Changes
- Add a first-class SMB browsing abstraction that supports SMB2/SMB3 and produces seek-capable playback sources.
- Support SMB profile input in **both formats**:
  - Windows UNC: `\\host\share`
  - SMB URI: `smb://host/share`
- Add secure "remember password" storage:
  - Do not store plaintext passwords in SQLite.
  - Persist secrets encrypted using platform-protected keys (Android Keystore for Android; DPAPI for Windows).
- Implement Android SMB streaming + seeking using **SMBJ (Apache-2.0)** with ExoPlayer via a custom `DataSource` (range/seek aware).
- Update UI to edit SMB profiles (host/share, path, username, domain, remember password toggle).
- Add unit tests for parsing, storage, and the SMB streaming adapter glue.

## Impact
- Affected specs:
  - `source-access`
  - `media-playback`
  - `local-storage`
  - `ui-prototype`
- Affected code:
  - Shared `src/AgiBuild.Audixa` (SMB abstractions, URI parsing, SQLite schema/migration, secure secret store interface)
  - `src/AgiBuild.Audixa.Android` (SMBJ interop, ExoPlayer DataSource integration)
  - `src/AgiBuild.Audixa.Desktop` (Windows secret store implementation)


