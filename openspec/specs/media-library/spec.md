# media-library Specification

## Purpose
TBD - created by archiving change add-media-library-system. Update Purpose after archive.
## Requirements
### Requirement: Multiple Media Libraries
The system SHALL allow users to create and manage multiple media libraries with explicit types.

#### Scenario: Create libraries
- **WHEN** the user creates new libraries
- **THEN** each library is stored with its own name, type, and source configuration

### Requirement: Library Types
The system SHALL support the following library types: local-manual, local-folder, webdav, and cloud-drive.

#### Scenario: Library type is enforced
- **WHEN** a library is created
- **THEN** it is labeled with one of the supported types and drives available actions

### Requirement: Local Manual Library Items
The system SHALL allow users to add local media file references to a local-manual library without copying file contents.

#### Scenario: Add local file reference
- **WHEN** the user adds a local file to a manual library
- **THEN** the system stores a reference URI and displays it in the library item list

### Requirement: Local Folder Library Listing
The system SHALL derive local-folder library items from a configured directory path.

#### Scenario: List items from a folder
- **WHEN** the user opens a local-folder library
- **THEN** items are listed from the current directory contents

### Requirement: Local Folder Live Updates
The system SHALL update local-folder library items when files are added or removed in the watched directory.

#### Scenario: File added to folder
- **WHEN** a new media file appears in the watched directory
- **THEN** the library item list is updated to include it

### Requirement: WebDAV Library Listing
The system SHALL list WebDAV library items by querying the configured WebDAV directory.

#### Scenario: Manual refresh
- **WHEN** the user triggers refresh on a WebDAV library
- **THEN** the system updates the item list from the remote directory

### Requirement: WebDAV Credentials Security
The system SHALL store WebDAV credentials in the OS keychain and only keep a key reference in the local database.

#### Scenario: Credentials storage
- **WHEN** the user saves WebDAV credentials
- **THEN** the raw credentials are stored in the OS keychain and the database stores only a key reference

### Requirement: Cloud Drive Placeholder
The system SHALL provide cloud-drive libraries as UI placeholders without active listing integration.

#### Scenario: Cloud drive UI only
- **WHEN** a user creates a cloud-drive library
- **THEN** the UI shows login and directory selection placeholders without listing files

### Requirement: Library Item Playback
The system SHALL allow selecting a library item to play it in the player.

#### Scenario: Play a library item
- **WHEN** a user selects a library item
- **THEN** the player loads and plays the referenced media

