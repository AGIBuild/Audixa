# Change: Add SMB browse cache (directory listing)

## Why
SMB directory listing on Android/slow networks can be noticeably slow, especially when users navigate back-and-forth. A small cache improves perceived performance and reduces redundant network calls.

## What Changes
- Add an in-memory cache for SMB directory listings keyed by profile/host/share/path.
- Support **explicit refresh** to bypass cache.
- Cache is time-bounded (TTL) and size-bounded (LRU) to avoid unbounded memory growth.
- Cache results are per-process only (no persistence).

## Impact
- Affected specs: `source-access`
- Affected code: `AgiBuild.Audixa` (Sources), `LibraryViewModel`, platform `ISmbBrowser` registrations


