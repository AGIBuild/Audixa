## ADDED Requirements

### Requirement: SMB browse infinite scroll
The UI SHALL support loading additional SMB directory entries automatically when the user scrolls near the end of the list.

#### Scenario: Auto load next page
- **WHEN** the user scrolls near the bottom of the SMB directory listing
- **THEN** the app SHALL load the next page automatically if available

#### Scenario: Manual fallback
- **WHEN** auto load is not triggered or fails
- **THEN** the user SHALL still be able to load additional entries via an explicit "Load more" action


