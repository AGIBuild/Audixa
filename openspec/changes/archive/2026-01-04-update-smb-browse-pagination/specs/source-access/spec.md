## ADDED Requirements

### Requirement: SMB directory listing pagination
The app SHALL support paginated directory listing for SMB sources to keep the UI responsive for large directories.

#### Scenario: Initial page
- **WHEN** the user opens an SMB directory
- **THEN** the app SHALL load and display at most the configured page size of entries

#### Scenario: Load more
- **WHEN** the user requests more entries for the current SMB directory
- **THEN** the app SHALL load the next page and append entries without duplicates

#### Scenario: Refresh resets paging
- **WHEN** the user triggers a manual refresh for the current SMB directory
- **THEN** the app SHALL bypass caches and restart pagination from the first page


