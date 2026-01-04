# Change: SMB browse pagination for large directories

## Why
SMB shares can contain very large directories. Fetching and sorting the entire listing can be slow and memory-heavy, causing UI stalls and poor UX on mobile.

## What Changes
- Add paginated SMB directory listing for UI consumption.
- Default page size for SMB listing (configurable).
- Provide a "Load more" interaction for SMB listing.
- Keep caching behavior compatible with `update-smb-browse-cache` (cache pages, bypassable via ForceRefresh).

## Impact
- Affected specs: `source-access`, `ui-prototype`
- Affected code: `ISmbBrowser` abstraction, platform SMB browsers, `LibraryViewModel` SMB listing UI


