## MODIFIED Requirements

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
- **THEN** it uses Flint 400 #abb5b8 without a side stripe
- **AND** the current-page underline is Flint #889396, hover underlines use amber #e3b56c and keyboard focus uses the shared ink ring, without route-specific accents.

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

### Requirement: Every listening action identifies the existing session

The shell SHALL mark shared controls for the active editorial source as full-opacity disabled In player status with a white action label, amber #e3b56c bars/edge, #f0d7b0 In player status label and the translucent amber rgba(227, 181, 108, 0.16) surface across Store, Releases and details. Other sources SHALL retain Listen. The floating player's Open and Stop actions SHALL remain available on desktop and mobile. Stop SHALL end the session on its first activation without confirmation. Status MUST NOT claim verified playback.

#### Scenario: A session is minimized and its source appears elsewhere

- **WHEN** shell navigation, cached restoration or detail rendering shows the active source
- **THEN** its listening control displays In player and cannot open a second session
- **AND** the floating player remains the place to reopen or stop the existing session.

#### Scenario: A session is stopped or replaced

- **WHEN** Stop ends the session or another source replaces it
- **THEN** all previously matching controls return to their original enabled label
- **AND** a cached page is synchronized with the current source when restored.

#### Scenario: Store cards offer listening

- **WHEN** a Store collection renders a record with a verified source
- **THEN** its 112 × 44px listening action appears below artwork and before the title in Grid
- **AND** source-less records retain row alignment without displaying an invented action.
- **AND** Grid actions align with card text.

#### Scenario: The Store Crate's item in hand listens from its own card

- **WHEN** the Store Crate holds an item with a verified source
- **THEN** that item's own Store card offers its Listen action beside the bin, with its source, provider data and current session state
- **AND** activating it opens the player for that item, and closing the player returns focus to it
- **AND** it displays In player while that source is the active session.

#### Scenario: Stop is pressed once

- **WHEN** the shopper activates Stop in the floating player
- **THEN** the session ends with the existing Stop semantics, including focus restoration and iframe removal.
- **AND** no confirmation state or second activation is required.

### Requirement: Homepage hero offers Store entry points

The homepage hero SHALL show, under the motto, a Browse the Store link to `/store/` as its only action. The hero SHALL NOT render a See pre-orders link. The showcase SHALL preserve its server-rendered content and use the shell's existing load hydration directive so its local press feedback works on direct entry, cold shell entry and cached return, including when the starting page has not registered an idle directive. Browse the Store SHALL remain available in the initial HTML independently of the showcase. The hero SHALL show no Scroll label; its animated scroll line keeps its existing states.

#### Scenario: Visitor lands on Home with pre-orders open

- **GIVEN** the Worker reports at least one stocked pre-order
- **WHEN** the visitor opens Home
- **THEN** the hero shows only Browse the Store under the motto
- **AND** Browse the Store opens `/store/`
- **AND** the pre-orders showcase remains available further down Home

#### Scenario: Main page loads before the pre-order showcase is ready

- **WHEN** Home has rendered and its pre-order interactions have not hydrated
- **THEN** the hero, motto and Browse the Store link remain available
- **AND** no additional hero action appears when the server-rendered showcase becomes interactive
- **AND** the showcase loads automatically at browser idle priority without requiring scrolling or a click

#### Scenario: Visitor lands on Home with no pre-orders open

- **GIVEN** the Worker reports no stocked pre-orders
- **WHEN** the visitor opens Home
- **THEN** the hero shows Browse the Store
- **AND** no See pre-orders link is shown

#### Scenario: Visitor sees the hero without a Scroll label

- **WHEN** the homepage hero renders
- **THEN** no Scroll text is shown
- **AND** the animated scroll line still hides without a transition once the hero is scrolled

#### Scenario: Hero action uses the approved exception

- **WHEN** Browse the Store renders
- **THEN** it is the sole 48px control, with a #e8e8e8 face, #090909 label, Bebas Neue 18px capitals and trailing arrow
- **AND** padding is 22px start/18px end with an 11px icon gap; tagline-to-button spacing increases by 16px on phones and 24px from 48rem, with sideways-phone hero height unchanged (owner-approved 16 October 2026, commit 3e8ee282)
- **AND** hover or keyboard focus raises a #626e72 fill from the base in 240ms, makes the label white and moves the arrow 6px inside the fixed box
- **AND** reduced motion uses the same final state instantly and native Store navigation remains unchanged.
