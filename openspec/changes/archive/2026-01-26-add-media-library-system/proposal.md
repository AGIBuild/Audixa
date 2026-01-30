# Change: Add media library system

## Why
Library should represent user-defined media collections. Users need multiple libraries with different sources (manual files, local folders, WebDAV, cloud drive placeholders) instead of a flat imported list.

## What Changes
- Add a media library domain model with multiple library types.
- Store library metadata, sources, and items in the local database.
- Implement local manual libraries (file references only).
- Implement local folder libraries with directory scanning and live watching.
- Implement WebDAV libraries with manual refresh and keychain-stored credentials.
- Add cloud drive libraries as UI-only placeholders (login + folder selection).
- Rebuild Library UI for multi-library creation and item browsing.

## Impact
- Affected specs: `media-library`
- Affected code: `apps/desktop` data layer, repository, state store, Library UI, Tauri plugin configuration
