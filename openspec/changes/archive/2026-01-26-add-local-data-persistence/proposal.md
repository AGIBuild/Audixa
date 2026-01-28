# Change: Add local data persistence for desktop

## Why
The desktop UI currently renders mock data, so user library and learning data cannot be retained across app restarts. Local-first persistence is required to make real workflows usable and consistent with the architecture requirements.

## What Changes
- Introduce a local persistence layer for desktop data (media library + learning data).
- Replace mock data usage with repository-backed reads and writes.
- Add a desktop import flow for local media and subtitle references.
- Add schema versioning and forward-only migrations for stored data.

## Impact
- Affected specs: `desktop-data`
- Affected code: `apps/desktop` UI/state, data repository module, Tauri app configuration
