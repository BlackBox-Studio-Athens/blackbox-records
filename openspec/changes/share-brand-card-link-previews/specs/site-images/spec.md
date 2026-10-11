# Spec Delta

## MODIFIED Requirements

### Requirement: Link previews, small brand marks, and the header logo are fit for their role

The system SHALL keep link-preview and small brand-mark images within derivative sizes appropriate to their use, and SHALL never lazy-load the header logo.

#### Scenario: A page publishes link-preview metadata

- **WHEN** any public page or the PRD Holding Page emits `og:image` and `twitter:image`
- **THEN** both reference the one 1200 × 630 JPEG brand card resolved against the site origin
- **AND** the brand logo sits inside the card's centre 630 px square, so square crops keep the whole logo
- **AND** no Content Image or original upload is referenced for link previews.

#### Scenario: The PRD Holding Page shows its logo

- **WHEN** the Holding Page renders its logo at 72 to 120 CSS pixels
- **THEN** it uses a derivative no wider than 240 pixels
- **AND** its brand card metadata image and closed asset set remain valid.

#### Scenario: The header renders on any page

- **WHEN** the header brand logo renders
- **THEN** it loads eagerly, because it can be the first-viewport LCP element
- **AND** it keeps its fingerprinted derivative and stable geometry.
