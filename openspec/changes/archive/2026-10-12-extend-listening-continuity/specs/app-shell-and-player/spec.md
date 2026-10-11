## MODIFIED Requirements

### Requirement: Same-document shell navigation

The system SHALL intercept exact top-level section, Store collection-category, Store Item detail and purchase-information navigation through the persistent shell while preserving direct page loads and excluding checkout documents.

#### Scenario: Shopper switches sections

- **GIVEN** a shopper clicks a header, footer, or mobile-nav section link
- **WHEN** the destination is Home, Artists, Releases, Store, Services, About, or another declared top-level shell route
- **THEN** `AppShellRoot` fetches and swaps the rendered `<main>` content
- **AND** scroll resets, focus moves to `main[data-app-shell-main]`, and transition indicators run without a full document reload.

#### Scenario: Shopper switches Store categories

- **GIVEN** a shopper follows Store category navigation
- **WHEN** the destination is `/store/`, `/store/blackbox-releases/`, `/store/distro/`, or `/store/merch/`
- **THEN** the route is handled as shell section kind `store`
- **AND** each normalized pathname receives distinct history and same-session snapshot state
- **AND** the persistent player and StoreCart bridge remain owned by the shell.

#### Scenario: Shopper opens a Store Item while listening

- **GIVEN** a player session is minimized
- **WHEN** the shopper follows a link to `/store/<slug>/` from a Store card, a Release card or a detail overlay
- **THEN** the route is handled as shell kind `store-item` and swaps `<main>` with the full Store Item page layout
- **AND** the same player iframe stays connected and its purchase controls hydrate
- **AND** Store collection behaviour keyed on kind `store` does not run on the item page.

#### Scenario: Shopper opens purchase information while listening

- **WHEN** the destination is `/terms/`, `/privacy/` or `/withdrawal/`
- **THEN** the route is handled as shell kind `information`
- **AND** the player session survives the navigation.

#### Scenario: Shopper follows a Store Item or checkout link

- **WHEN** the destination is a Store Item detail
- **THEN** the shell handles it as kind `store-item`, never as a Store collection route
- **WHEN** the destination is cart checkout, checkout return, or an item-scoped checkout route
- **THEN** the section matcher does not treat it as a shell route
- **AND** existing non-section navigation behavior remains authoritative.

#### Scenario: Store Item slug does not exist

- **WHEN** the shell fetches a `/store/<slug>/` document that is not found
- **THEN** it falls back to native navigation.

#### Scenario: Visitor reaches the legacy Distro path

- **WHEN** the destination pathname is `/distro/`
- **THEN** the shell section matcher rejects it
- **AND** the static compatibility document redirects to `/store/distro/`.

## ADDED Requirements

### Requirement: Bandcamp embeds use the house dark appearance

The system SHALL render every valid Bandcamp embed with the house appearance, whatever appearance options the stored URL carries: `size=large`, `bgcol=0d0d0d`, `linkcol=f5f5f5`, `artwork=big`, `transparent=true`, and `tracklist=false` for a track. Only the album or track identity SHALL come from the stored URL.

#### Scenario: Staff paste Bandcamp's default light embed

- **GIVEN** a stored embed URL with `bgcol=ffffff` and `linkcol=0687f5`
- **WHEN** the player provider is derived
- **THEN** the embed URL uses the house appearance for the same album
- **AND** content validation accepts the stored URL
- **AND** the staff Bandcamp field stores the house URL for a newly pasted embed.

#### Scenario: Embed carries an unknown option

- **WHEN** a stored Bandcamp embed URL contains an option outside the supported set
- **THEN** content validation rejects it and no provider is derived.
