## ADDED Requirements

### Requirement: Consistent editing icon cues

Staff editing forms SHALL reuse the installed outline icon family for useful field-type, section and editing-action cues across shared Website and Catalog editors, image and relationship pickers, ordered rows, tracklists, catalog creation, selling and stock forms. Icons SHALL preserve visible labels, existing values, disabled states, validation and business behavior. Decorative icons SHALL be hidden from assistive technology; icon-only controls SHALL retain accessible action names. Checkboxes and switches MAY retain their existing affordances without redundant icons.

#### Scenario: Identify a field while editing

- **WHEN** a member edits text, dates, links, images, prices, quantities or shipping estimates
- **THEN** useful icons appear alongside the existing labels without entering the input value or changing its accessible name

#### Scenario: Reorder an embedded list

- **WHEN** a member edits a repeater or tracklist
- **THEN** add, remove, move up and move down retain their visible action text and existing ordering behavior with consistent decorative icons

#### Scenario: Use a keyboard or screen reader

- **WHEN** a member navigates a staff form with assistive technology
- **THEN** icons introduce no extra keyboard stops or spoken content and labels, required indicators and validation remain available

#### Scenario: Edit on a phone

- **WHEN** a member opens an editing form at a narrow phone width
- **THEN** the additional icons preserve readable labels, full-width controls, existing touch-target sizes and wrapping action rows without introducing horizontal page overflow
