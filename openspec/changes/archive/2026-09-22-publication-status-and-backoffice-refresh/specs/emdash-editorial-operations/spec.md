## MODIFIED Requirements

### Requirement: Staff editing remains accessible and task-first

The workspace SHALL provide content lists, forms, media selection, draft preview, publication status, and actionable errors using current BlackBox terminology and branding. Content, Images, Items, Stock, and Orders SHALL use a consistent staff workspace hierarchy with task-specific headings, compact operational controls, semantic status treatments, and responsive layouts.

#### Scenario: Member uses a narrow screen or keyboard

- **WHEN** routine editing runs at 320 CSS pixels or with keyboard navigation
- **THEN** required controls remain visible without page-level horizontal overflow
- **AND** controls have accessible names, visible focus, error association, adequate contrast, and at least 44 by 44 CSS-pixel primary touch targets.

#### Scenario: Member previews a draft

- **WHEN** a member previews Home, About, Services, Artist, Release, Store Item, or News content
- **THEN** the preview shows the pending content and media clearly marked as a draft
- **AND** preview does not publish it or expose draft content through public routes.

#### Scenario: Member moves between staff workspaces

- **WHEN** a member moves between Content, Images, Items, Stock, and Orders
- **THEN** the workspace keeps consistent heading hierarchy, spacing, action placement, status language, loading feedback, and focus treatment
- **AND** each workspace retains its current data ownership, permissions, and direct links.

#### Scenario: A workspace read or operation is pending

- **WHEN** a member opens, refreshes, searches, or submits an operation in a staff workspace
- **THEN** the affected region shows a named loading or pending state without hiding unrelated usable data
- **AND** duplicate unsafe actions are disabled until the operation settles.

#### Scenario: A workspace read or operation fails

- **WHEN** a staff read or operation fails
- **THEN** the workspace preserves safe last-known context where applicable, shows an actionable error with text and an icon or status treatment, and leaves an accessible retry or recovery action available
- **AND** it does not invent identifiers, statuses, quantities, order facts, or publication results.
