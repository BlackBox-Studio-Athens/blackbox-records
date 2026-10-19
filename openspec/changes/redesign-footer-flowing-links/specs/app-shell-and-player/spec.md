## MODIFIED Requirements

### Requirement: Mobile footer links form a balanced navigation group

The footer SHALL render compact, naturally wrapping destination links in reading order, with at least 44px-high targets. Browsing links SHALL precede configured Delivery information, Withdraw from an order and conditional Privacy information. Links SHALL retain native destinations and shell continuity.

#### Scenario: Footer renders on a narrow screen

- **WHEN** the footer renders at a phone width
- **THEN** the logo and social controls share a row, the full Staff description follows, and navigation flows across as many rows as its labels require without horizontal overflow
- **AND** the reference content at normal text size stays within 380px at 320px width and 360px at 390px width

#### Scenario: Footer is used on desktop

- **WHEN** a visitor follows a footer section link on desktop
- **THEN** the identity row, flowing navigation and copyright/disclosure area remain compact and preserve destinations and the persistent shell/player
- **AND** the reference footer stays within 285px at 768px width and 245px at 1440px width

#### Scenario: Content or text size grows

- **WHEN** copy is longer, configured link or social counts change, or text is enlarged to 200%
- **THEN** the footer grows without clipping, truncation, reduced targets or horizontal scrolling
- **AND** every link remains reachable and operable with the minimized player present

## ADDED Requirements

### Requirement: Website creation assistance is disclosed

The shared footer SHALL visibly state: "This website was designed and developed with assistance from generative AI tools." The statement SHALL follow the copyright row and use readable supporting text, without making claims about the site's music or artwork.

#### Scenario: Visitor reaches the footer

- **WHEN** any page using the shared site layout renders
- **THEN** the exact statement is readable beneath copyright, including without JavaScript and after shell navigation

### Requirement: Footer preserves content authority

The footer SHALL retain configured labels, browsing order, visibility, social destinations and Staff description. Each destination SHALL appear once. Privacy information SHALL retain its purchase-information availability condition. Copyright SHALL retain its label, year range and establishment-year rules.

#### Scenario: Optional content is unavailable

- **WHEN** social URLs are blank or placeholders, navigation entries are hidden, or purchase information is unavailable
- **THEN** those optional links are omitted, the withdrawal link remains available and the layout reflows without empty reserved columns
