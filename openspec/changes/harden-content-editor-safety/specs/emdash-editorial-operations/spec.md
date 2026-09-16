## MODIFIED Requirements

### Requirement: Editorial fields retain their supported meaning

CMS editing SHALL cover every existing public content collection and fixed page structure while preserving references, stable slugs, rich-text meaning, validation, media descriptions, and deletion restrictions. The editor SHALL expose actionable validation beside the affected field before a save or publication request, while the server SHALL remain the final authority for content validity and reference/media existence.

#### Scenario: Existing content migrates

- **WHEN** Artists, Releases, Distro, News, page copy, purchase information, navigation, social links, newsletter copy, and settings are imported
- **THEN** record counts, source identities, links, dates, ordering, media, and rendered semantics reconcile against the source inventory
- **AND** migration neither drops optional fields nor invents missing content or prices.

#### Scenario: Member edits a referenced record

- **WHEN** an Artist title changes or a Release selects an Artist
- **THEN** the persisted stable identity and public slug survive title changes
- **AND** relations use existing records rather than duplicate manually maintained choices.

#### Scenario: Member attempts destructive content work

- **WHEN** a member edits an Artist, Release, Store Item, fixed page, or fixed navigation entry
- **THEN** ordinary editing does not offer hard deletion
- **AND** News and social-link deletion retains confirmation and reference safety
- **AND** stop-selling and archive actions preserve order and stock history.

#### Scenario: Invalid content is submitted directly

- **WHEN** a request bypasses form constraints for a URL, slug, reference, date, image, bounded list, or required field
- **THEN** server validation rejects it with actionable field errors
- **AND** arbitrary scripts, executable markup, unsafe embeds, and unsupported fields cannot enter rendered content.

#### Scenario: Member enters invalid content in the editor

- **WHEN** a required value is blank, a constrained value is malformed, or a nested row is invalid
- **THEN** the affected field exposes an associated error and invalid state
- **AND** Save and Publish do not send a mutation until all current fields pass the shared content validation rules.

#### Scenario: Member discards edits

- **WHEN** a member has unsaved changes and selects Discard changes
- **THEN** the workspace asks for confirmation before replacing or clearing the edited values
- **AND** canceling preserves values and focus
- **AND** confirming a saved record reloads its saved revision while confirming a new record returns to the collection list without saving.

### Requirement: Staff editing remains accessible and task-first

The workspace SHALL provide content lists, forms, media selection, draft preview, publication status, and actionable errors using current BlackBox terminology and branding. Every editable Content field SHALL expose semantic labels, associated validation messages, visible invalid state, and keyboard-reachable focus. Preview SHALL be a visual aid and SHALL not replace field validation.

#### Scenario: Member uses a narrow screen or keyboard

- **WHEN** routine editing runs at 320 CSS pixels or with keyboard navigation
- **THEN** required controls remain visible without page-level horizontal overflow
- **AND** controls have accessible names, visible focus, error association, adequate contrast, and at least 44 by 44 CSS-pixel primary touch targets.

#### Scenario: Member previews a draft

- **WHEN** a member previews Home, About, Services, Artist, Release, Store Item, or News content
- **THEN** the preview shows the pending content and media clearly marked as a draft
- **AND** preview does not publish it or expose draft content through public routes.

#### Scenario: Member fixes an invalid field

- **WHEN** a member corrects the field associated with a validation error
- **THEN** the field error clears when the current content is valid
- **AND** the first invalid field can be reached by the form's validation focus behavior without losing other edits.
