## ADDED Requirements

### Requirement: News is reachable from the main navigation

The public main navigation SHALL include News as its last section on desktop and in the phone Menu, linking to `/news/`. It SHALL use the existing section-link appearance, current-page underline, keyboard focus and same-document routing. The footer navigation SHALL remain unchanged.

#### Scenario: Visitor returns to News from another section

- **GIVEN** a visitor is browsing another public section
- **WHEN** they choose the final News link in the desktop header or phone Menu
- **THEN** the existing News listing opens without reloading the document
- **AND** News becomes the current section, focus moves to the main content and the viewport returns to the top
- **AND** the phone Menu closes after navigation

#### Scenario: Visitor reads an article and returns to the listing

- **GIVEN** the visitor reached News through the main navigation
- **WHEN** they open a News article and close its detail overlay
- **THEN** they return to the News listing with News still marked as the current section

#### Scenario: News navigation preserves an existing player

- **GIVEN** a visitor has interacted with and minimized the music player
- **WHEN** they navigate to News and open and close an article
- **THEN** the existing player iframe remains connected and the player can be reopened

#### Scenario: Main navigation fits desktop and phone widths

- **WHEN** the navigation is displayed at 320, 390, 1024 or 1440 px
- **THEN** News is the final section link without clipping or horizontal overflow
- **AND** phone Menu links retain targets at least 44 px tall
