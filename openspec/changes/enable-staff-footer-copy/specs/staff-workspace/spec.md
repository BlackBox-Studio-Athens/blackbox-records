## ADDED Requirements

### Requirement: Edit public footer text through Label details

Staff SHALL find a Footer text destination under Website → Navigation & footer that opens the existing Label details singleton. That singleton SHALL offer an optional plain-text footer description alongside Label name and Year established. Saving SHALL retain the existing private draft, revision conflict and explicit publication behavior; footer links SHALL retain their existing editor.

#### Scenario: Change footer copy

- **WHEN** a member edits Footer text and saves a private draft
- **THEN** accepted public footer copy remains unchanged until that exact settings revision is published
- **AND** preview and publication use the existing settings entry and shared Footer template

#### Scenario: Read older or reset settings

- **WHEN** accepted settings omit Footer text or contain a null, empty or whitespace-only value
- **THEN** the Footer retains the existing configured description
- **AND** no settings data or draft is automatically replaced
