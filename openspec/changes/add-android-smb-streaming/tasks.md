## 1. Proposal / Spec
- [x] 1.1 Add spec deltas for `source-access`, `media-playback`, `local-storage`, `ui-prototype`
- [x] 1.2 Run `openspec validate add-android-smb-streaming --strict` and fix issues
- [x] 1.3 Get approval before implementation

## 2. Domain & Storage
- [x] 2.1 Extend `SmbProfile` to structured fields (host/share/rootPath/username/domain) and a `SecretId`
- [x] 2.2 Add `Secrets` table and migrations (store ciphertext only)
- [x] 2.3 Implement `ISecureSecretStore` (Save/Get/Delete) and per-platform encryption:
  - [x] Android Keystore (AES/GCM) protector
  - [x] Windows DPAPI protector
- [x] 2.4 Unit tests for migration + secret store roundtrip (Windows)

## 3. SMB Browsing Abstraction
- [x] 3.1 Introduce `ISmbBrowser` (ListDirectory, GetMetadata) and `ISmbRandomAccessReader` (ReadAt)
- [x] 3.2 Desktop implementation: UNC/local filesystem mapping (existing behavior, moved out of ViewModel)
- [x] 3.3 Android implementation: SMBJ-backed listing and random access reads
- [x] 3.4 Unit tests for SMB path normalization and profile parsing (UNC + smb://)

## 4. Android SMB Streaming Playback (seekable)
- [x] 4.1 Add SMBJ Android binding project and wire dependency resolution
- [x] 4.2 Implement ExoPlayer `DataSource` for `smb://...` URIs using SMBJ random access reads
- [x] 4.3 Integrate the custom `DataSource.Factory` into `AndroidMediaPlayerAdapter`
- [x] 4.4 Add retry/backoff and clear error surfaces for auth failures / missing share / IO errors

## 5. UI Updates
- [x] 5.1 Library: SMB profile editor supports both `\\host\share` and `smb://host/share` inputs
- [x] 5.2 Add fields: username, domain, password + "remember password" toggle
- [x] 5.3 Ensure UX remains aligned with prototypes (desktop strict, mobile adaptive)

## 6. Tests & Verification
- [x] 6.1 Unit tests for `SmbUri` parsing + canonicalization
- [x] 6.2 Unit tests for `AndroidMediaPlayerAdapter` wiring (scheme -> DataSource selection) where feasible
  - Note: Platform-specific JNI/ExoPlayer wiring cannot be unit-tested; verified via manual integration testing.
- [x] 6.3 `dotnet build -c Release` + `dotnet test -c Release`


