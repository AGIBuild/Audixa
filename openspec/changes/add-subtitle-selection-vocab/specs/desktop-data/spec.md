## ADDED Requirements
### Requirement: Vocabulary Pronunciation Storage
The system SHALL persist an optional pronunciation field for vocabulary entries in the desktop database.

#### Scenario: Persist pronunciation
- **WHEN** a vocabulary entry includes pronunciation data
- **THEN** the data store saves it alongside the definition

#### Scenario: Missing pronunciation
- **WHEN** a vocabulary entry has no pronunciation
- **THEN** the data store saves a null/empty value without failure
