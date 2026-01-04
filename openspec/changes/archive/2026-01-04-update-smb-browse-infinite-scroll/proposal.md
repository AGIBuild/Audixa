# Change: SMB browse infinite scroll (auto load more)

## Why
For large SMB directories, requiring manual "Load more" taps slows navigation and feels heavy. Auto-loading the next page when the user scrolls near the bottom improves flow while keeping an explicit button as a fallback.

## What Changes
- Add auto "load next page" when the user scrolls near the bottom of the SMB list.
- Keep the existing "Load more" button as a fallback (and for accessibility).
- Show a lightweight status text like "Loaded N items".

## Impact
- Affected specs: `ui-prototype`, `source-access`
- Affected code: `LibraryView` (scroll detection), `LibraryViewModel` (loaded count / guards)


