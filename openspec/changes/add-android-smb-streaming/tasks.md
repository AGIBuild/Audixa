## 1. Proposal / Spec
- [ ] 1.1 Add spec deltas for `source-access`, `media-playback`, `local-storage`, `ui-prototype`
- [ ] 1.2 Run `openspec validate add-android-smb-streaming --strict` and fix issues
- [ ] 1.3 Get approval before implementation

## 2. Domain & Storage
- [ ] 2.1 Extend `SmbProfile` to structured fields (host/share/rootPath/username/domain) and a `SecretId`
- [ ] 2.2 Add `Secrets` table and migrations (store ciphertext only)
- [ ] 2.3 Implement `ISecureSecretStore` (Save/Get/Delete) and per-platform encryption:
  - [ ] Android Keystore (AES/GCM) protector
  - [ ] Windows DPAPI protector
- [ ] 2.4 Unit tests for migration + secret store roundtrip (Windows)

## 3. SMB Browsing Abstraction
- [ ] 3.1 Introduce `ISmbBrowser` (ListDirectory, GetMetadata) and `ISmbRandomAccessReader` (ReadAt)
- [ ] 3.2 Desktop implementation: UNC/local filesystem mapping (existing behavior, moved out of ViewModel)
- [ ] 3.3 Android implementation: SMBJ-backed listing and random access reads
- [ ] 3.4 Unit tests for SMB path normalization and profile parsing (UNC + smb://)

## 4. Android SMB Streaming Playback (seekable)
- [ ] 4.1 Add SMBJ Android binding project and wire dependency resolution
- [ ] 4.2 Implement ExoPlayer `DataSource` for `smb://...` URIs using SMBJ random access reads
- [ ] 4.3 Integrate the custom `DataSource.Factory` into `AndroidMediaPlayerAdapter`
- [ ] 4.4 Add retry/backoff and clear error surfaces for auth failures / missing share / IO errors

## 5. UI Updates
- [ ] 5.1 Library: SMB profile editor supports both `\\host\share` and `smb://host/share` inputs
- [ ] 5.2 Add fields: username, domain, password + "remember password" toggle
- [ ] 5.3 Ensure UX remains aligned with prototypes (desktop strict, mobile adaptive)

## 6. Tests & Verification
- [ ] 6.1 Unit tests for `SmbUri` parsing + canonicalization
- [ ] 6.2 Unit tests for `AndroidMediaPlayerAdapter` wiring (scheme -> DataSource selection) where feasible
- [ ] 6.3 `dotnet build -c Release` + `dotnet test -c Release`


