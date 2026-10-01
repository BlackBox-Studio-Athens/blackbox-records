## ADDED Requirements

### Requirement: Main navigation is one model on every surface

The public site SHALL build one main navigation in which Home is structural and always first, followed by the main-menu sections editors choose.

- The phone Menu SHALL list Home and every section.
- The desktop header SHALL list the sections beside the logo, which links Home.
- The header, the Menu and the footer sitemap SHALL render page links through one link model and one link style, so a destination keeps the same attributes, accent and current-page state wherever it appears.

#### Scenario: Shopper opens the Menu on a phone

- **WHEN** a shopper below the desktop breakpoint opens the Menu
- **THEN** Home is the first link, followed by the main-menu sections in editorial order
- **AND** Home appears exactly once
- **AND** following Home uses same-document shell navigation and preserves the persistent player.

#### Scenario: The current page is marked

- **WHEN** a header, Menu or footer link targets the current page
- **THEN** it carries `aria-current="page"` and the shared underline marker under its label
- **AND** after same-document shell navigation, the header and footer links update without a reload.

#### Scenario: Store and Services links are not current

- **WHEN** a Store or Services link does not target the current page
- **THEN** it uses the neutral link colour without a side stripe
- **AND** it shifts to its route accent only on hover from a hover-capable pointer, keyboard focus or press.

#### Scenario: Shopper uses the Menu button

- **WHEN** the header renders below the desktop breakpoint
- **THEN** the Menu button shows its icon with the visible label Menu, which is also its accessible name
- **AND** it exposes `aria-haspopup="dialog"` and an `aria-expanded` value that matches the Menu
- **AND** closing the Menu with Escape or Close returns focus to the button.

#### Scenario: The layout reaches the desktop breakpoint

- **WHEN** the viewport widens to the desktop breakpoint while the Menu is open
- **THEN** the Menu closes, because only the phone layout offers it.

#### Scenario: Shopper taps navigation on a small phone

- **WHEN** the viewport is 320 to 390 CSS pixels wide
- **THEN** every Menu link, the Menu Close control and every footer sitemap link is at least 44 CSS pixels tall
- **AND** the footer sitemap wraps onto more lines instead of clipping a link
- **AND** the page has no horizontal overflow.
