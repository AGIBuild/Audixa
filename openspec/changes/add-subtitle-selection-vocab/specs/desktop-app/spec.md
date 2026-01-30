## ADDED Requirements
### Requirement: Subtitle Selection Lookup UI
The desktop player SHALL allow subtitle text selection in the subtitle list and show a lookup panel for the selected word.

#### Scenario: Select text in subtitle list
- **WHEN** the user selects a word in the subtitle list panel
- **THEN** the UI opens a lookup panel anchored to the selection

#### Scenario: Cancel selection
- **WHEN** the selection is cleared or the panel is dismissed
- **THEN** the UI hides the lookup panel

### Requirement: Add Vocabulary From Lookup
The desktop player SHALL allow adding the selected word to the vocabulary list from the lookup panel.

#### Scenario: Add from lookup panel
- **WHEN** the user clicks "Add to vocabulary" in the lookup panel
- **THEN** the word is stored and appears in the Vocabulary screen
