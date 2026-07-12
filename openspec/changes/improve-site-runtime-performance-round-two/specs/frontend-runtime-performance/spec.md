## MODIFIED Requirements

### Requirement: Representative routes meet load and scroll budgets

The system MUST keep primary and secondary public route classes within declared load, first-traversal, and repeat-traversal budgets.

#### Scenario: Fixed desktop route loads are measured

- **WHEN** the declared 1440×900 DPR-1 cache-cleared production profile runs at least five times
- **THEN** Home LCP is no more than 2.0 seconds
- **AND** Store, Distro, Artists, Services, About, Releases, and News LCP are each no more than 2.5 seconds
- **AND** CLS is no more than 0.1 on every measured route
- **AND** median and p75 values are reported without discarding a valid slow run.

#### Scenario: Mobile stress route loads are measured

- **GIVEN** the declared 390×844 DPR-2 profile uses 4× CPU, 150 ms round-trip latency, 1.6 Mbps download, and a cleared cache
- **WHEN** Home, Store, Distro, Artists, Services, and About run at least three times
- **THEN** each route's LCP is no more than 2.5 seconds
- **AND** CLS is no more than 0.1
- **AND** font, image, JavaScript, request, and long-task outliers remain represented in the report.

#### Scenario: First and repeat CPU-stressed scrolling are measured

- **GIVEN** the declared wide or mobile route profile is settled before user traversal and uses 4× CPU throttling
- **WHEN** the same fixed segment and input cadence are captured at least three times for first traversal and at least three times for repeat traversal
- **THEN** first traversal is reported separately and is never discarded as warm-up
- **AND** application-attributable main-thread plus style, layout, and paint work has a p95 no greater than 8 milliseconds per frame
- **AND** frame interval p95 is no greater than 16.7 milliseconds
- **AND** no application-attributable main-thread or rendering slice exceeds 16.7 milliseconds
- **AND** no application-attributable task or long animation frame reaches 50 milliseconds.

#### Scenario: A budget is missed

- **WHEN** a representative route misses a load or scroll budget
- **THEN** the evidence identifies the responsible main-thread, style, layout, paint, raster, network, font, animation, or hydration work before another optimization is selected
- **AND** an unrelated visual or architectural rewrite is not accepted as the diagnosis.

### Requirement: Long catalog pages skip offscreen rendering

The system SHALL balance initial rendering and first traversal on Store and Distro without requiring one containment strategy for every route or breakpoint.

#### Scenario: Long catalog initially renders

- **WHEN** Store or Distro contains content beyond the viewport
- **THEN** the complete server-rendered catalog remains present in source order
- **AND** any offscreen-rendering boundary uses measured semantic groups or bounded chunks rather than mandatory strict containment on every card
- **AND** intrinsic-size estimates, when used, are measured for the owning route and breakpoint
- **AND** client-side virtualization is not introduced by default.

#### Scenario: Shopper begins the first traversal

- **WHEN** previously skipped content approaches the declared first-scroll corridor
- **THEN** it is rendered or activated early enough to pass the first-traversal budget
- **AND** an activated group remains rendered until route exit
- **AND** the shopper sees no blank corridor, late card pop, scrollbar jump, overlapping content, broken image loading, horizontal overflow, or input stall
- **AND** keyboard order, find-in-page, accessibility-tree access, and shell scroll reset remain correct.

#### Scenario: Grouped or retained activation misses the route budget

- **WHEN** measured grouped containment or retained ahead-of-viewport activation still misses first or repeat traversal
- **THEN** `content-visibility` is disabled for the failing route and breakpoint when the declared load and interaction budgets remain passing
- **AND** first-scroll quality is not sacrificed solely to preserve an initial-layout optimization.

#### Scenario: Native and eager strategies both miss

- **WHEN** neither measured containment nor eager rendering can satisfy both load and traversal budgets
- **THEN** implementation stops and records the residual trace
- **AND** pagination, virtualization, infinite scrolling, or node recycling requires an amended OpenSpec design with accessibility and shell-navigation acceptance before implementation.

### Requirement: Critical font delivery is bounded and glyph-safe

The system MUST deliver the existing Veneer brand font without modifying its bytes and without a late font-driven layout task.

#### Scenario: Font modification rights remain unavailable

- **GIVEN** the repository contains no license that permits modification or subsetting
- **WHEN** the main-site font path is prepared
- **THEN** `veneer_regular.woff2` remains byte-for-byte identical to the existing 312,816-byte source
- **AND** no subset, conversion, glyph removal, outline extraction, or generated font derivative is produced
- **AND** an automated SHA-256 parity check covers every retained copy of the asset.

#### Scenario: Main site requests Veneer

- **WHEN** bundled main-site CSS declares the Veneer face
- **THEN** Astro or Vite emits a fingerprinted font URL covered by the immutable static cache policy
- **AND** the declaration uses `font-display: optional`
- **AND** the approved `Veneer, Bebas Neue, Impact, sans-serif` fallback order remains intact
- **AND** the stable public font path is not requested by the main site.

#### Scenario: Holding Page retains a stable font asset

- **WHEN** the PRD Holding Page artifact is built
- **THEN** its required stable public WOFF2 and stylesheet remain in the closed asset set
- **AND** the public stylesheet also prevents a late font swap
- **AND** the Holding Page artifact check proves that its font bytes match the main-site source.

#### Scenario: Font loading is profiled

- **WHEN** the final critical font path is traced with the declared desktop and mobile stress profiles
- **THEN** it produces no repeatable font-triggered task or long animation frame of 50 milliseconds or longer
- **AND** no late font load triggers a repeatable layout burst
- **AND** font preload remains absent unless at least three equivalent A/B runs improve LCP without delaying primary media or reintroducing layout work.

#### Scenario: Fallback and cached typography are reviewed

- **WHEN** the font is unavailable on first navigation or available from cache later
- **THEN** English, Greek, accents and diacritics, long public titles, navigation, cards, Store and checkout labels, and the Holding Page remain legible
- **AND** mobile and desktop screenshots show no clipping, overlap, broken hierarchy, or material layout shift.

## ADDED Requirements

### Requirement: Initial JavaScript is route-proportional

The system SHALL keep the complete first-party eager JavaScript graph within budget and exclude dormant code owned by other routes.

#### Scenario: Home loads

- **WHEN** Home completes its initial production load
- **THEN** its complete first-party eager JavaScript graph is no more than 95 KiB using actual hosted Brotli transfer size
- **AND** Artists filters, Services form code, Store cart presentation, detail overlay presentation, and player presentation are absent unless required by immediate Home behavior
- **AND** the separately measured app-shell closure remains no more than 95 KiB Brotli.

#### Scenario: A route owns a portal

- **WHEN** Artists, Services, or Store becomes the active direct or shell-managed route
- **THEN** only that route's required portal code loads through an active-route or first-intent boundary
- **AND** portal loading does not require a full document navigation
- **AND** other route-specific portal chunks remain dormant.

#### Scenario: StoreCart convenience state initializes

- **WHEN** the eager shell reads or updates browser-only StoreCart state
- **THEN** the eager path contains only the minimum event and parsing behavior needed for the existing localStorage contract
- **AND** malformed or unsupported stored values remain fail-safe
- **AND** Zod remains at API, Worker, money, and other authoritative trust boundaries even if the browser convenience-state parser no longer imports it.

#### Scenario: Third-party analytics is measured

- **WHEN** the production load trace includes analytics code
- **THEN** first-party and third-party graphs are reported separately
- **AND** analytics startup changes only when a repeated A/B attributes material LCP or long-task cost to it
- **AND** provider replacement is not justified by transfer size alone.

### Requirement: Settled hidden UI is animation-idle

The system SHALL stop nonessential infinite animation when the owning interface is hidden, closed, or past its useful threshold.

#### Scenario: Route loading indicator is closed

- **WHEN** the shell route-loading indicator state is not open
- **THEN** its bar performs no animation, paint, or compositing work
- **AND** opening the indicator restores the existing visible loading cue.

#### Scenario: Shopper passes the Home hero threshold

- **WHEN** the coarse Home hero state becomes scrolled
- **THEN** the hidden scroll cue and its descendants perform no animation work
- **AND** returning above the threshold may restore the visible cue without per-frame custom-property writes.

#### Scenario: Reduced motion is requested

- **WHEN** the browser reports a reduced-motion preference
- **THEN** route loading and hero cue motion remain disabled in both active and inactive states
- **AND** visible status and loading meaning remain available without motion.
