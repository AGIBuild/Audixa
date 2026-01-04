## 1. Implementation
- [x] 1.1 Add shared cache component (TTL + size bound)
- [x] 1.2 Extend SMB browse request to support `ForceRefresh`
- [x] 1.3 Implement `CachedSmbBrowser` decorator and wire it in platform modules
- [x] 1.4 Update `LibraryViewModel` to use `ForceRefresh` for manual refresh action

## 2. Tests
- [x] 2.1 Unit test: cache hit returns cached list
- [x] 2.2 Unit test: `ForceRefresh=true` bypasses cache
- [x] 2.3 Unit test: TTL expiry fetches again


