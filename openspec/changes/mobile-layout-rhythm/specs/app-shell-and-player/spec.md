## MODIFIED Requirements

### Requirement: Mobile footer links form a balanced navigation group

The footer SHALL follow the owner-approved Flowing links composition in `redesign-footer-flowing-links`, superseding this change's original 200px/four-column design. It SHALL retain production copy, native destinations and 44px targets, with browsing links before delivery, withdrawal and available privacy. Content SHALL grow and wrap rather than clip.

#### Scenario: Footer renders on a narrow screen

- **WHEN** the footer renders at a phone width
- **THEN** the logo and social icons share a 44px row, the full tagline follows, and navigation wraps naturally in reading order without horizontal overflow
- **AND** sentence-case copyright and Est. precede the AI assistance disclosure, both rules stay within the page frame, and normal reference content meets the newer change's height ceilings

#### Scenario: Footer is used on desktop

- **WHEN** a visitor follows a footer section link on desktop
- **THEN** the approved compact identity row, flowing navigation, destinations and persistent shell/player navigation remain usable.

#### Scenario: Production copy wraps beyond the reference

- **WHEN** longer copy, a narrow viewport or enlarged text needs more space
- **THEN** the footer grows beyond the approximate height without truncating copy, changing link order or shrinking targets
- **AND** its last links remain reachable above the minimized player.
