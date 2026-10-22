# Spec Delta

## ADDED Requirements

### Requirement: About text keeps a readable measure

On wide screens, the About page's text column (introduction, Philosophy and Contact) SHALL be no wider than 46rem inside its existing card, and its paragraphs SHALL stop at 34rem, so they stay near 65 to 75 characters per line. The photograph above it SHALL keep its current width, and phones SHALL keep their current layout.

#### Scenario: Visitor reads About on desktop

- **WHEN** the About page renders at 1280px
- **THEN** Philosophy paragraphs measure no more than 75 characters per line
- **AND** the contact directory stays usable and does not overflow within the narrower column.
