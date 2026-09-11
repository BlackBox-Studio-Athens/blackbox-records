## Purpose

Connect Store Items to verified music and editorial context through the existing custom site player without changing commerce or navigation authority.

## ADDED Requirements

### Requirement: Supported Store Items reuse the custom site player

The system SHALL expose a Listen action for a Store Item whose verified source release provides supported music-player data and MUST reuse the site's existing single active player session.

#### Scenario: Source release has supported listening data

- **WHEN** a shopper activates Listen on its Store Item
- **THEN** the existing custom site player opens with that release's supported provider data and identity
- **AND** the page does not create an independent player or autoplay based only on loading the page.

#### Scenario: The same release already has a session

- **WHEN** a Store Item listening action targets that release
- **THEN** it follows the existing session reuse and provider-selection rules
- **AND** a second simultaneous iframe session is not created.

#### Scenario: Supported listening data is absent

- **WHEN** the Store Item has no supported source-release player data
- **THEN** it exposes no misleading or disabled Listen action
- **AND** any independently verified release and artist links remain available
- **AND** normal item and purchase information remains available.

#### Scenario: Shopper discovers listening from the item

- **WHEN** a supported Store Item is viewed on desktop or mobile
- **THEN** the existing recognizable Listen treatment appears near title/artist before the long description, with restrained verified editorial links
- **AND** Add to Cart remains the primary purchase action with its current readiness behavior
- **AND** listening does not create a separate media panel or duplicate the purchase-information change's identity/option/price/action group.

### Requirement: Editorial links use verified source relationships

The system SHALL link a release-backed Store Item to its actual source release and, where resolved, its related artist, without guessing from titles or labels.

#### Scenario: A verified editorial relation exists

- **WHEN** the Store Item is rendered
- **THEN** its release link and available artist link target the actual base-aware editorial routes
- **AND** normal internal activation uses existing overlay behavior while direct and new-tab loads remain valid pages.

#### Scenario: An optional relation is absent

- **WHEN** an artist relation is unavailable or a Distro item has no explicit editorial relation
- **THEN** the corresponding link is omitted
- **AND** no unrelated artist, release, or embed is inferred from matching text.

#### Scenario: A required source release cannot resolve

- **WHEN** a release-backed Store Item references a missing release
- **THEN** content validation or the build reports the invalid relationship
- **AND** it does not silently substitute another release.

### Requirement: Listening preserves purchase and player boundaries

The system MUST preserve the selected sellable option, existing player accessibility/lifecycle, and current document-navigation limits when adding listening and editorial context.

#### Scenario: Shopper reads release formats

- **WHEN** editorial metadata mentions formats beyond the Store Item being purchased
- **THEN** the purchase area still clearly identifies its actual option
- **AND** editorial formats do not imply additional selectable or purchasable variants.

#### Scenario: Shopper dismisses or stops the player

- **WHEN** the player is dismissed before or after actual embed interaction, or Stop is activated
- **THEN** the existing close/minimize/stop rules and focus behavior apply
- **AND** iframe load alone does not claim playback or create a ready mini-player.

#### Scenario: Navigation crosses a document boundary

- **WHEN** the shopper opens another Store Item document, checkout, reloads, or opens a new tab
- **THEN** current full-document behavior remains in force
- **AND** the UI does not promise iframe continuity across that boundary.

#### Scenario: Shopper uses keyboard or reduced motion

- **WHEN** the added actions are used on desktop or mobile
- **THEN** Listen has an accessible button name, editorial links are keyboard reachable, and existing visible focus/reduced-motion rules apply
- **AND** a player failure does not disable independent purchase actions.
