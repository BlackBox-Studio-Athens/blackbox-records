## MODIFIED Requirements

### Requirement: Detail overlays

The system SHALL open artist, release, and news detail routes as overlays for shell-managed navigation while preserving full Astro pages for direct loads. An open overlay SHALL be a dialog named by its detail title, and the document title SHALL read `<detail title> | <site name>` while it is open. Closing an overlay without routing SHALL keep the list's scroll position and return focus to the card that opened it. A link inside an overlay to a document the shell does not handle SHALL navigate natively without adding a duplicate history entry. A delayed content-focus callback SHALL do nothing once its overlay scroll container is missing or disconnected.

#### Scenario: Detail link opens in shell

- **GIVEN** a shell-managed page contains a release, artist, or news detail link
- **WHEN** the user follows that link
- **THEN** the shell fetches the partial overlay route
- **AND** the overlay dialog's accessible name and the document title carry the detail title
- **AND** direct loads to the same detail URL still render full pages.

#### Scenario: Shopper closes an overlay far down a list

- **GIVEN** a shopper opened a detail overlay from a card far down a list
- **WHEN** they close it with Close, Escape, the backdrop or Back
- **THEN** the list keeps its scroll position and focus returns to the card without scrolling
- **AND** the previous document title is restored.

#### Scenario: A delayed focus callback outlives its panel

- **GIVEN** an overlay content-focus callback is scheduled for a later animation frame
- **WHEN** its scroll container is missing or disconnected at execution
- **THEN** the callback does not scroll the document or focus a stale close button
- **AND** the background list retains its position and restored trigger focus.
