# Staff workspace

## Purpose

Provide one protected, environment-aware workspace for staff editorial, catalog, stock, and order operations while preserving draft privacy, commerce authority, and accessible recovery.

## Shared navigation and language

The workspace SHALL use one dark staff shell with Overview, Catalog, Website, Images, Stock and Orders. Domain terms SHALL follow UBIQUITOUS_LANGUAGE.md. Existing content and variant URLs SHALL remain usable, and browser Back SHALL retain list context.

The shared shell SHALL use a 72 px top navigation at widths of at least 1440 px and a compact labeled Menu drawer below that width. All six areas SHALL remain equally prominent. Catalog SHALL open Releases and Website SHALL open Pages. Only those two areas SHALL have a 256 px contextual sidebar, visible during editing and manually hideable with a remembered per-area preference. Navigation SHALL retain pending-save protection and accessible keyboard focus. Add SHALL reuse existing creation flows; View website SHALL open the matching environment's public homepage in a new tab.

The Staff identity SHALL use the approved Office stamp C artwork extracted from the selected image, with transparent background and preserved lettering, proportions and badge. It SHALL NOT approximate that artwork with a separate HTML Staff label. The logo SHALL link to Overview with accessible name BlackBox Records Staff. Public branding SHALL remain unchanged.

## Private drafts and explicit publication

Incomplete editorial drafts SHALL autosave after a 1.5-second typing pause, with at most one write in flight and coalesced later edits. Structural, size, security and supplied-reference validation SHALL remain enforced. Every publication and snapshot path SHALL enforce completeness. Conflicts and failures SHALL retain local input. An older response SHALL NOT replace newer typing.

Publication review SHALL identify the exact saved entry version and destination. New typing SHALL remain private. Accepted per-entry revision state SHALL determine whether an entry is On the website. The latest global publication SHALL NOT imply that another entry is live. Multi-entry review SHALL preserve the twenty-entry limit and operation recovery identity. Persistent staging is superseded.

## Catalog tasks

Release, distro and merch creation SHALL guide Details, Price & starting stock and Review. Website-only releases SHALL skip selling and remain publishable. Explicit confirmation SHALL precede price/stock creation. Details, Selling and Stock SHALL share one destination while preserving service authority and duplicate prevention.

## Automatic reads

Ordinary tasks SHALL require no Refresh button. Active orders and selected stock SHALL update every 60 seconds. Pending publication SHALL poll every 2 seconds for one minute, then every 30 seconds, stopping at settlement or 30 minutes. Hidden/offline background work SHALL pause. Errors SHALL retain useful data and offer contextual recovery. Stock baseline changes SHALL require reassessment without clearing entered counts or notes.

## Orders

Search and filters SHALL apply to the complete server result set, with bounded cursor pagination and preserved access controls. Rows SHALL prioritize purchased titles, recognizable order/customer identity, date, amount and payment state. Email delivery SHALL NOT imply dispatch.

## Acceptance

Local acceptance SHALL cover incomplete drafts, typing during saves, conflicts, offline recovery, duplicate operations, publication failure, hidden polling, stale stock counts, order pagination and access denial. Chromium and Firefox SHALL cover 390, 768, 1280 and 1600 px, keyboard, reduced motion and real shared-template previews. At 390 px the first editable field SHALL begin within 250 px. Final repository/editor gates and content/publication checks SHALL pass before hosted rollout. UAT requires the Cloudflare Free-tier preflight; payment launch and fulfillment automation are outside this change.

## Requirements

### Requirement: Browse a growing catalog

Staff MUST filter distro and merch by existing format groups before cursor pagination through EmDash. Lists MUST retain editorial-only entries and restore their navigation state.

#### Scenario: Find an entry beyond the first page

- **WHEN** a member filters or searches a catalog with more than 250 entries
- **THEN** all matching entries are reachable through 25-entry pages, with artwork and publication state

### Requirement: Count a fixed stocktake sequence

Stock MUST support a responsive full-width inventory and a guided, individually confirmed stocktake. Physical quantities remain commerce-owned; editorial enrichment MUST use EmDash APIs without per-row content requests.

#### Scenario: A stock count is interrupted

- **WHEN** a count response is lost or the current baseline changes
- **THEN** local input and recovery context are retained and advancement waits for confirmation or explicit reassessment

#### Scenario: Count a group

- **WHEN** a member starts a stocktake
- **THEN** its order is fixed by format and title, each confirmed count is recorded immediately, and new catalog additions wait for the next stocktake

### Requirement: Shared website changes review

The staff workspace SHALL provide a protected `/review/` destination, linked from utilities and Overview, that discovers unpublished Website and Catalog entries using EmDash APIs and accepted publication state. It SHALL retain incomplete drafts with blockers, expose pending publication state, and support search, area filtering and 25-entry pages without truncating discovery to the first source page.

#### Scenario: Publish one or several saved changes

- **WHEN** a member reviews up to twenty ready entries, including editorial changes linked to selling setup
- **THEN** one batch publishes exactly those reviewed versions, preserving unselected drafts, prices, stock and shop availability
- **AND** newer versions require renewed review, pending operations retain their identities, and shop activation remains explicitly approved in Selling

#### Scenario: Enter review from an editor

- **WHEN** the member chooses Publish changes in an editor
- **THEN** autosave finishes before the shared review opens with only that saved entry selected
- **AND** failed saves and conflicts preserve local input and prevent publication

#### Scenario: Return from editing

- **WHEN** a member returns to review after editing or a same-tab reload
- **THEN** selection and browse position are restored, and saved versions are rechecked before confirmation
