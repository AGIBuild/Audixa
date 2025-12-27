## ADDED Requirements

### Requirement: Secure secret storage for SMB credentials
The system SHALL persist remembered SMB passwords using platform-protected encryption and SHALL NOT store SMB passwords in plaintext in SQLite.

#### Scenario: Remembered SMB password survives app restart
- **GIVEN** the user saved an SMB profile with "remember password" enabled
- **WHEN** the application is restarted
- **THEN** the system SHALL be able to authenticate to the SMB server using the stored secret

#### Scenario: Removing an SMB profile removes the stored secret
- **GIVEN** an SMB profile has a remembered password
- **WHEN** the user deletes the profile
- **THEN** the stored secret SHALL be deleted


