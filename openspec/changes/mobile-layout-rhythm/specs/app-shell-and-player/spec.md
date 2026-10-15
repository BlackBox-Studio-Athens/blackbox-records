## MODIFIED Requirements

### Requirement: Mobile footer links form a balanced navigation group

The phone footer SHALL form a compact group targeting approximately 290px at the approved 390px reference. It SHALL retain production copy, legal text, logo, social destinations, sitemap order and Delivery information. Links and controls SHALL have 44px targets; content SHALL grow and wrap rather than clip to meet the reference height.

#### Scenario: Footer renders on a narrow screen

- **WHEN** the footer renders at a phone width
- **THEN** social icons sit beside the logo and sitemap links wrap inline in 44px tap rows without horizontal overflow or an isolated delivery-information row
- **AND** the Sitemap label is visually hidden on phones, two-line meta sits beside Slate #66a2d2 Est. 2026 at the 390px reference, and footer/meta rules stay within the page frame.

#### Scenario: Footer is used on desktop

- **WHEN** a visitor follows a footer section link on desktop
- **THEN** the existing composition, destination and persistent shell/player navigation remain usable.

#### Scenario: Production copy wraps beyond the reference

- **WHEN** longer copy, a narrow viewport or enlarged text needs more space
- **THEN** the footer grows beyond the approximate height without truncating copy, changing link order or shrinking targets
- **AND** its last links remain reachable above the minimized player.
