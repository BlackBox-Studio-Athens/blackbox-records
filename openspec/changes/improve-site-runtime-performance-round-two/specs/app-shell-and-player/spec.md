## MODIFIED Requirements

### Requirement: Initial app-shell work follows immediate intent

The app shell SHALL keep navigation-critical behavior eager while loading dormant shell-owned and route-specific UI only for the active route or its first relevant intent.

#### Scenario: A normal route first hydrates

- **WHEN** `AppShell` hydrates on page load
- **THEN** same-document navigation interception, route state, focus reset, scroll reset, required event names, and minimal state bridges become ready immediately
- **AND** dormant cart drawer, player presentation, overlay presentation, mobile sheet content, and route-specific portal presentation are not all part of the initial eager closure
- **AND** the initial app-shell JavaScript closure is no more than 95 KiB using actual hosted Brotli transfer size.

#### Scenario: Active route owns a portal outlet

- **WHEN** Artists, Services, or Store is the active direct-load or shell-managed pathname and its server-rendered portal target exists
- **THEN** only the owning route's portal presentation loads through a direct route-owned import
- **AND** Artists filters, Services inquiry UI, and Store cart presentation are not mutually eager dependencies
- **AND** existing server content remains usable while a portal chunk loads or fails.

#### Scenario: Shopper first requests dormant shell UI

- **WHEN** the shopper first opens the cart, player, detail overlay, mobile menu, or route-specific portal
- **THEN** the required code loads through a direct intent-owned path
- **AND** existing accessible loading feedback covers any visible delay
- **AND** the interaction completes without a full document navigation.

#### Scenario: StoreCart event bridge becomes ready

- **WHEN** the shell installs eager StoreCart add, open, checkout-update, and page-show behavior
- **THEN** event names and non-visual state parsing do not require checkout-summary or cart-presentation modules
- **AND** the bridge still initializes, persists, opens, and refreshes StoreCart under the existing convenience-state contract.

#### Scenario: Player code has loaded

- **WHEN** a player session is opened, minimized, reopened, carried through shell navigation, or stopped
- **THEN** the established single-session player behavior remains unchanged
- **AND** code splitting does not move player ownership into page-local content.

## ADDED Requirements

### Requirement: Hidden shell animation work follows visible state

The app shell SHALL run nonessential infinite loading and orientation animation only while the owning cue is visible and active.

#### Scenario: Route loading is inactive

- **WHEN** `isRouteLoading` resolves false and the loading indicator is closed
- **THEN** the loading bar's sweep animation is stopped rather than hidden by opacity alone
- **AND** the closed indicator creates no focus stop, announcement, or pointer target.

#### Scenario: Route loading begins

- **WHEN** same-document navigation enters its visible loading state
- **THEN** the existing loading bar may animate for that bounded active interval
- **AND** it stops after completion, cancellation, error recovery, or the existing reset timeout.

#### Scenario: Home scroll cue is no longer visible

- **WHEN** the existing coarse Home scrolled class hides the scroll cue
- **THEN** the cue's child animation is stopped
- **AND** returning above the threshold restores the cue only while Home is active.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** loading and scroll-cue animation remain disabled
- **AND** shell navigation state, route completion, and visible content remain understandable without motion.
