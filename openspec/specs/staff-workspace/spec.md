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

Staff MUST filter distro and merch by existing format groups before cursor pagination through EmDash. Lists MUST retain editorial-only entries and restore their navigation state. Distro & merch, Artists, Releases, and News SHALL expose the same explicit Previous/Next behavior wherever they use the shared content list, with at most 25 entries per page.

When multiple pages exist, Previous and Next SHALL appear above and below the results with visible text and a readable position summary. The upper controls SHALL be discoverable without scrolling through the entries at supported viewport sizes. The first page SHALL disable Previous and the final page SHALL disable Next. The interface SHALL distinguish entries on the current page from a total count; it SHALL NOT invent a total or offer unsupported page-number jumps.

#### Scenario: Find an entry beyond the first page

- **WHEN** a member filters or searches a catalog with more than 250 entries
- **THEN** all matching entries are reachable through 25-entry pages, with artwork and publication state
- **AND** the existing All, Distro, Merch, format, search, and sort choices apply to the complete collection before paging
- **AND** a fixed matching collection can be traversed to its end without skipped or duplicate entries, including entries sharing a title or edit timestamp

#### Scenario: Discover and advance the list

- **WHEN** a member opens the first page of Distro & merch with more results available
- **THEN** labeled paging controls and the current position are visible above the results without searching the bottom of the list
- **WHEN** the member successfully advances using either Next control
- **THEN** the next batch replaces the current batch and its beginning is brought into view, with keyboard focus on the results heading and an announced position update

#### Scenario: Reach a boundary or empty result

- **WHEN** the collection has zero, fewer than 25, exactly 25, or a partially filled final page of entries
- **THEN** the interface presents the actual returned entries and a truthful empty or end state
- **AND** Next is available only when the service supplies a continuation, irrespective of the current row count
- **AND** an empty filtered result retains the search/filter controls and provides a clear way to reset them

### Requirement: Count a fixed stocktake sequence

Stock MUST support a responsive full-width inventory and a guided, individually confirmed stocktake. Physical quantities remain commerce-owned; editorial enrichment MUST use EmDash APIs without per-row content requests.

#### Scenario: A stock count is interrupted

- **WHEN** a count response is lost or the current baseline changes
- **THEN** local input and recovery context are retained and advancement waits for confirmation or explicit reassessment

#### Scenario: Count a group

- **WHEN** a member starts a stocktake
- **THEN** its order is fixed by format and title, each confirmed count is recorded immediately, and new catalog additions wait for the next stocktake

### Requirement: Shared website changes review

The staff workspace SHALL provide a protected `/review/` destination, linked from utilities and Overview, that discovers unpublished Website and Catalog entries, including catalog entries whose only change is an EmDash price draft, using EmDash APIs and accepted publication state. It SHALL retain incomplete drafts with blockers, expose pending publication state, and support search, area filtering and 25-entry pages without truncating discovery to the first source page.

#### Scenario: Publish one or several saved changes

- **WHEN** a member reviews up to twenty ready entries, including editorial changes linked to selling setup
- **THEN** one batch publishes exactly those reviewed versions, preserving unselected drafts, price drafts, stock and shop availability
- **AND** newer versions require renewed review, pending operations retain their identities, and shop activation and price drafts remain applied from the item's own publish review.

#### Scenario: Enter review from an editor

- **WHEN** the member chooses Publish changes in an editor
- **THEN** autosave finishes before the review opens with only that saved entry and its price draft selected
- **AND** failed saves and conflicts preserve local input and prevent publication.

#### Scenario: Return from editing

- **WHEN** a member returns to review after editing or a same-tab reload
- **THEN** selection and browse position are restored, and saved versions are rechecked before confirmation.

### Requirement: Staff startup loads only immediately needed features

The initial staff view SHALL avoid loading rich-text editing and publication-history features until the corresponding feature is opened. Shared labels and navigation metadata SHALL remain usable without importing those features or unrelated content-schema initialization. Website Pages and catalog list views SHALL also exclude feature-specific code and styles for unopened editors, media pickers, and selling/stock editors. Shared UI primitives, read-only catalog summaries and validation required by an active feature or data boundary SHALL remain available. Existing save, conflict, recovery, and navigation behavior SHALL be preserved.

#### Scenario: Member opens a routine workspace

- **WHEN** a member opens Overview, Stock, or Orders with history closed
- **THEN** initial loading does not request rich-text editor JavaScript, its feature-specific styles, or publication-history JavaScript
- **AND** opening history or an editor subsequently loads and displays that feature with accessible loading and error feedback.

#### Scenario: Member browses Website or Catalog

- **WHEN** a member opens Pages, Releases, or Distro without opening an editor or picker
- **THEN** the browse view becomes usable without downloading code or styles specific to those closed editing features
- **AND** displayed catalog summaries still include their existing publication and selling information
- **AND** subsequently opening an editor loads its required styles and controls before presenting usable editing fields.

#### Scenario: Shared format labels are needed without an editor

- **WHEN** the shared navigation or stock filter displays catalog format labels
- **THEN** those labels do not introduce unrelated content editing, snapshot, or publication-review schema initialization into the initial JavaScript
- **AND** validation actually used by the current view and its data boundaries remains intact.

#### Scenario: Member navigates with unsaved or recovering work

- **WHEN** content autosave is pending, a save conflicts or fails, or a stock/order action is recovering
- **THEN** existing save-before-leave, conflict, and recovery protection remains effective
- **AND** performance changes neither discard work nor satisfy authoritative reads from newly introduced persistent caches.

### Requirement: Overview panels become usable independently

Each Overview panel SHALL expose its own loading, success, empty, or error state without waiting for unrelated panels. Responses from a superseded page activation SHALL NOT replace current data. The recent-drafts summary SHALL use bounded editorial and publication reads and SHALL NOT depend on obtaining price or stock information. Its existing recent-work scope, ordering, entry links and publication truth SHALL remain intact; complete paginated draft discovery SHALL remain available through Review changes.

#### Scenario: Order summary is slow or unavailable

- **WHEN** the content workspace and publication reads succeed while the order summary remains pending or fails
- **THEN** drafts and publication information become usable as their own reads finish
- **AND** only the order panel remains loading or shows its error and retry state.

#### Scenario: Commerce information cannot be read

- **WHEN** a member opens Overview while price or stock information is slow or unavailable
- **THEN** successful editorial and publication reads still produce the recent-drafts panel
- **AND** the panel retains incomplete drafts and distinguishes accepted, changed and pending versions without loading all catalog records or relying on a global publication status.

#### Scenario: Recent-work reads are reduced

- **WHEN** the Overview summary is prepared
- **THEN** it obtains at most the existing five recent candidates per collection through the supported content reader and omits unused list enrichment
- **AND** current accepted revisions and pending publications still determine the same ordered summary of at most 20 unpublished entries
- **AND** diagnostics distinguish SQL statement counts from database binding calls rather than treating either as proof of latency.

### Requirement: Compact catalog and stock artwork has a bounded payload

Catalog and stock rows displaying small artwork SHALL request private display thumbnails rather than original images. An initial view of 25 such images SHALL transfer at most 1 MiB of encoded image bodies in total, excluding HTTP headers, and SHALL preserve image descriptions and reserved layout dimensions.

#### Scenario: Stock contains high-resolution covers

- **WHEN** 25 rows reference multi-megabyte originals
- **THEN** row rendering requests only bounded derivatives and never downloads those originals implicitly
- **AND** absent or failed thumbnails produce fixed-size placeholders without retry loops or layout shifts.

### Requirement: Staff performance acceptance distinguishes local proof from hosted results

Performance acceptance SHALL record repeatable request, rendering, and resource evidence for the same deployed revision and documented network conditions. Rendering comparisons SHALL use a verified foreground browser with normal frame scheduling and SHALL state the observed content-readiness condition. Acceptance SHALL NOT require measurements from a specific country. Local or UAT checks alone SHALL NOT establish that the PRD latency issue is resolved. Acceptance SHALL retain individual slow and failed visits and SHALL distinguish initial resources, warm resources, changing ingress conditions, usable data and completed artwork.

#### Scenario: An optimized candidate is assessed

- **WHEN** the candidate completes local functional and performance checks
- **THEN** authorized UAT smoke checks verify the candidate before promotion, and a separately authorized bounded PRD pilot records HTML and asset response timing, time to usable content, image bytes, request counts, and relevant Worker and storage usage
- **AND** the evidence includes browser/network conditions, connection location, cache state, revision, sample count, and the median and range for small samples
- **AND** slow or incomplete results remain visible instead of being converted into a performance pass
- **AND** the evidence includes the start of primary data reads so startup delay is distinguishable from API duration.

#### Scenario: A median conceals a slow activation

- **WHEN** a warm route median meets its target but a measured activation exceeds 2500 ms to usable content or fails
- **THEN** the visit remains in the report with its observed cause or uncertainty
- **AND** repeatable application slowness or a functional regression keeps acceptance open; an isolated transport or tooling outlier may be qualified only with supporting evidence
- **AND** the result describes the measured conditions rather than promising that every visit is fast.

#### Scenario: Foreground scheduling or readiness capture is unreliable

- **WHEN** a sample has throttled frames, a missing readiness transition, or incomplete capture
- **THEN** it is retained with the reason and excluded from the comparable rendering cohort
- **AND** a slow but valid foreground sample remains in that cohort
- **AND** replacement probing stays within the reviewed operation budget.

#### Scenario: Repeat visits improve while the first visit remains slow

- **WHEN** a candidate removes a measured frontend dependency but still has a slow first visit
- **THEN** acceptance records first visits separately from repeat visits and distinguishes the verified frontend gain from unresolved document, connection, or application-read waits
- **AND** a passing repeat median does not establish resolution of the broader first-visit issue
- **AND** timing records are retained per navigation with missing or truncated evidence explicitly identified before attributing the remaining wait.

#### Scenario: Primary content precedes ancillary work

- **WHEN** rows or primary content are usable before artwork or independent panels finish
- **THEN** evidence reports the observed primary-content condition separately from artwork and other panel completion
- **AND** unfinished resources are not reported as zero-byte successes, failures, or proof of complete page readiness.

#### Scenario: Free-tier operation or infrastructure assumptions are unproven

- **WHEN** a pilot would exceed reviewed account allowance or the proposed infrastructure change lacks request attribution
- **THEN** affected hosted probing stops and local work or retained evidence is used
- **AND** no paid plan, new resource, or existing database/object relocation is inferred from the performance task
- **AND** an edge location or a best-effort location hint is not reported as proof of application or data placement.

### Requirement: Edit public footer text through Label details

Staff SHALL find a Footer text destination under Website → Navigation & footer that opens the existing Label details singleton. That singleton SHALL offer an optional plain-text footer description alongside Label name and Year established. Saving SHALL retain the existing private draft, revision conflict and explicit publication behavior; footer links SHALL retain their existing editor.

#### Scenario: Change footer copy

- **WHEN** a member edits Footer text and saves a private draft
- **THEN** accepted public footer copy remains unchanged until that exact settings revision is published
- **AND** preview and publication use the existing settings entry and shared Footer template

#### Scenario: Read older or reset settings

- **WHEN** accepted settings omit Footer text or contain a null, empty or whitespace-only value
- **THEN** the Footer retains the existing configured description
- **AND** no settings data or draft is automatically replaced

### Requirement: Consistent editing icon cues

Staff editing forms SHALL reuse the installed outline icon family for useful field-type, section and editing-action cues across shared Website and Catalog editors, image and relationship pickers, ordered rows, tracklists, catalog creation, selling and stock forms. Icons SHALL preserve visible labels, existing values, disabled states, validation and business behavior. Decorative icons SHALL be hidden from assistive technology; icon-only controls SHALL retain accessible action names. Checkboxes and switches MAY retain their existing affordances without redundant icons.

#### Scenario: Identify a field while editing

- **WHEN** a member edits text, dates, links, images, prices, quantities or shipping estimates
- **THEN** useful icons appear alongside the existing labels without entering the input value or changing its accessible name

#### Scenario: Reorder an embedded list

- **WHEN** a member edits a repeater or tracklist
- **THEN** add, remove, move up and move down retain their visible action text and existing ordering behavior with consistent decorative icons

#### Scenario: Use a keyboard or screen reader

- **WHEN** a member navigates a staff form with assistive technology
- **THEN** icons introduce no extra keyboard stops or spoken content and labels, required indicators and validation remain available

#### Scenario: Edit on a phone

- **WHEN** a member opens an editing form at a narrow phone width
- **THEN** the additional icons preserve readable labels, full-width controls, existing touch-target sizes and wrapping action rows without introducing horizontal page overflow

### Requirement: Global review offers saved-change discard

Global Review changes SHALL offer confirmed per-entry discard for saved records with live and draft revisions and no pending publication, using the existing revision-checked operation.

#### Scenario: Discard from global review

- **WHEN** a member chooses Discard saved changes and confirms the named eligible entry
- **THEN** only that draft is discarded using its reviewed current revision
- **AND** the list and saved selection refresh, later review uses the refreshed selection, and published content is unchanged
- **AND** repeated submission is disabled while discard is pending.

#### Scenario: Cancellation or conflict

- **WHEN** confirmation is cancelled or the submitted revision is stale
- **THEN** cancellation writes nothing and conflict rejection preserves the newer draft
- **AND** unrelated review selection is retained.

#### Scenario: Incomplete or never-published entry

- **WHEN** an incomplete saved draft has a live revision
- **THEN** completeness does not prevent discard
- **AND** never-published entries and entries with pending publication have no saved-change discard action.

### Requirement: Review controls reflect actionable changes

Review changes controls SHALL be visually and functionally disabled when their scope has no changes. Loading and read failure SHALL remain distinct from confirmed emptiness.

#### Scenario: Editor change state

- **WHEN** an editor has unsaved differences or saved unpublished differences
- **THEN** review is available subject to existing save/conflict guards
- **AND** unchanged or reverted content disables review, while autosave alone does not disable an unpublished change.

#### Scenario: Empty global review

- **WHEN** unfiltered discovery completes without changed entries
- **THEN** shell and Overview controls are disabled for mouse and keyboard with No changes to review feedback
- **AND** filtered emptiness or an empty page with a continuation does not establish global emptiness
- **AND** a newer saved revision with identical publishable values is not counted as a change.

#### Scenario: A meaningful field changes

- **WHEN** a member changes a slug, media identity or description, list order, or rich-text formatting
- **THEN** comparison preserves that difference as reviewable content
- **AND** matching saved revision IDs do not hide newer unsaved editor changes.

#### Scenario: Loading or failure

- **WHEN** change discovery is pending or fails
- **THEN** controls expose checking or recoverable error feedback instead of claiming no changes
- **AND** existing pending-publication recovery stays reachable.

#### Scenario: Refreshed review state

- **WHEN** save, discard, publication, or existing focus recovery refreshes change state
- **THEN** controls reflect that state without interval polling or an exact count
- **AND** empty or actually unchanged selected comparisons cannot advance to publication.
- **AND** shell and Overview share discovery rather than scanning once per control or keystroke.

### Requirement: Catalog artwork resolves to private thumbnails

Staff catalog rows with valid artwork and a prepared derivative SHALL render that derivative through existing private delivery. Missing derivatives SHALL use the existing preparation workflow for repair.

#### Scenario: Release artwork is prepared

- **WHEN** staff opens the release list, including the reported Disintegration case
- **THEN** each prepared artwork reference resolves to the correct loadable private thumbnail
- **AND** pagination and list-return context remain intact.

#### Scenario: Artwork cannot load

- **WHEN** artwork is absent, a derivative is missing, or its request fails
- **THEN** the row retains a stable placeholder without retry loops or original-image fallback
- **AND** existing private-access and derivative size limits remain enforced.

### Requirement: Staff control per-item restock intent

The protected stock detail SHALL provide a per-variant choice, When sold out online, show: Coming Soon, Repressing or Sold Out, with an optional Expected month for the first two. It SHALL be backed by the stock record, use revision-checked writes, and SHALL not alter physical or online quantities. Stock detail SHALL also show how many shoppers are waiting for an availability alert.

#### Scenario: Set a restock plan

- **WHEN** staff choose Coming Soon, Repressing or Sold Out for the selected item
- **THEN** the stock record persists the choice and advances its revision
- **AND** the control reflects the saved value without changing stock quantities or ledger entries
- **AND** its help text says the choice is shown only while no copies are available online.

#### Scenario: Set an expected month

- **WHEN** staff enter a month that has not passed for a Coming Soon or Repressing item
- **THEN** the month is saved with the choice; choosing Sold Out clears it
- **AND** a passed or malformed month is rejected and nothing is saved.

#### Scenario: Stock has not been recorded

- **WHEN** staff choose Coming Soon or Repressing before the item's first stock count
- **THEN** the system creates a zero-quantity stock record with that choice.

#### Scenario: Choose restock intent during Store Item setup

- **WHEN** staff set up a new Store Item and choose a zero-stock state
- **THEN** the selected value and optional month are saved on the opening Stock row
- **AND** an omitted selection defaults to Sold Out.

#### Scenario: Shoppers are waiting

- **WHEN** the selected variant has pending availability alerts
- **THEN** stock detail shows the waiting count without any address.

#### Scenario: A concurrent stock update occurs

- **WHEN** the submitted stock revision is stale
- **THEN** the update is rejected and existing stock, zero-stock state and expected month remain intact
- **AND** staff can refresh the selected item before retrying.

### Requirement: Staff owned scroll surfaces use Lenis with immediate recovery

The staff workspace SHALL use a lifecycle-owned Lenis runtime for the document/workspace and explicitly owned scroll panes. Saved navigation positions, focus restoration, validation recovery, and private preview synchronization MUST remain immediate. Draft protection and third-party editor behavior MUST remain intact.

#### Scenario: Staff navigates between workspace entries

- **WHEN** the staff workspace saves or restores a navigation entry
- **THEN** each owned scroll pane and the window restore its recorded position immediately
- **AND** focus returns to the recorded row or supplied fallback without an animated jump.

#### Scenario: Staff scrolls a nested workspace pane

- **WHEN** staff scrolls an owned list, editor outer pane, navigation drawer, or history/review panel
- **THEN** its Lenis instance handles that pane without double-consuming input in an ancestor
- **AND** EmDash editor internals, form controls, preview iframes, and third-party surfaces remain native.

### Requirement: Staff first-party surface transitions use lifecycle-safe Motion

Coordinated staff-owned drawer, history, and disclosure transitions SHALL use Motion while preserving dialog focus, save protection, and workspace contents. Reduced motion SHALL settle each transition immediately.

#### Scenario: Staff closes or interrupts a surface transition

- **WHEN** the staff member closes a drawer or a route replaces its contents during animation
- **THEN** the animation is canceled and its owner releases resources
- **AND** saved drafts, navigation recovery, and focus behavior remain usable.

### Requirement: Stock reads begin when navigation state is ready

Initial inventory entry, filter changes and page navigation SHALL begin their required reads when the requested state is resolved, without waiting for a text-search debounce. Text typing SHALL retain bounded debounce. Reads SHALL preserve current selection, recovery, hidden/offline behavior and stale-response protection.

#### Scenario: A member opens or changes an inventory view

- **WHEN** initial URL state is resolved or the member selects a filter or another inventory page
- **THEN** the corresponding inventory read begins without an artificial typing delay
- **AND** initial URL setup does not issue an obsolete default-state read before the requested one.

#### Scenario: A member types an inventory search

- **WHEN** successive keystrokes change the text query
- **THEN** the existing bounded typing debounce prevents a read for every keystroke
- **AND** only the current query's result replaces the displayed inventory.

### Requirement: Initial staff state represents the requested destination truthfully

Staff startup SHALL display a stable loading state until the requested destination is resolved and its required data is available. It SHALL NOT present another collection, a zero count, or a no-results message as a successful result before that determination. Loading, successful empty results and failures SHALL remain distinct and accessible.

#### Scenario: Website or a catalog deep link is opened

- **WHEN** a member opens Website, Releases, or Distro and startup is delayed
- **THEN** the initial main region displays neutral or destination-appropriate loading feedback
- **AND** it does not briefly claim that an unrelated Artists collection is empty
- **AND** the settled destination retains its intended controls and focus behavior using the existing workspace layout.

### Requirement: Background Overview refresh preserves settled panels

Overview's initial, retry, focus, visibility and reconnect reads for the same active resource and parameters SHALL coalesce concurrent reads and retain the last settled panel, including a successfully empty result. Refresh failures SHALL preserve settled results with contextual recovery. Existing authoritative mutation reads, hidden/offline pause and polling behavior SHALL remain effective.

#### Scenario: A member returns to Overview while a panel read is pending

- **WHEN** focus and visibility restoration request a refresh while an initial or later Overview panel read is pending
- **THEN** the panel reuses that read for the same resource and parameter set
- **AND** any previously settled content or empty result stays visible while the panel indicates that it is checking for updates.

#### Scenario: A refresh fails or returns out of order

- **WHEN** a background request fails or an older request finishes after a newer activation
- **THEN** failure does not erase the panel's settled result and offers relevant recovery
- **AND** an obsolete result does not replace the current activation's result
- **AND** other panels can still complete independently.

### Requirement: Page transitions preserve a usable list

Page transitions SHALL preserve the last successful rows, position, and navigation context until the requested page succeeds. Loading SHALL be communicated and duplicate page requests SHALL be prevented. A failed or superseded request SHALL NOT advance the displayed position or corrupt the previous-page trail. Changing the collection, search, area, format, or sort SHALL start a new paging sequence using the chosen criteria.

#### Scenario: A page request fails

- **WHEN** Next or Previous fails because of a network or service error
- **THEN** the current successful page, URL, previous-page trail, scroll position, and focused control remain usable
- **AND** an inline error offers a retry of the failed page without reloading the entire workspace or appending a duplicate history entry
- **AND** an access denial instead follows the existing access-required behavior and does not retain unauthorized content

#### Scenario: A newer browse intent supersedes an older response

- **WHEN** a member changes the filter or sort while an earlier page request is pending
- **THEN** only the newest intent can update rows, URL, position, loading state, or error feedback
- **AND** cursors from the prior criteria are not sent with the new criteria

#### Scenario: Repeated clicks or background reads occur

- **WHEN** Next is activated repeatedly, or an automatic read overlaps an explicit page transition
- **THEN** one successful user transition produces one page advance
- **AND** background reads do not change history, reset the page, or move focus or scroll

#### Scenario: A continuation becomes unusable

- **WHEN** a supplied cursor is rejected or repeats without progress, or a previously populated page becomes empty after catalog changes
- **THEN** the workspace stops automatic continuation attempts and offers a labeled return to the first page with the current criteria
- **AND** it does not misrepresent a service error as the end of the catalog

### Requirement: Browser navigation restores staff context

Browser Back and Forward SHALL restore successful staff navigation states, including collection or workspace, search, filters, sort, cursor, selected detail, and relevant tab. Same-tab reload SHALL restore the current addressable state and known previous-page context. Returning to a list SHALL restore its scroll position and originating item focus when that item still exists, otherwise its results heading. Explicit Next/Previous transitions SHALL be traversable through browser history; automatic refresh and history restoration SHALL NOT create new navigation entries.

#### Scenario: Traverse pages with browser history

- **WHEN** a member advances from page one to page two and page three, then uses browser Back twice and Forward once
- **THEN** the corresponding second, first, and second batches, criteria, positions, and controls are restored
- **AND** browser Back from page two does not skip page one to the workspace visited before the catalog

#### Scenario: Return from an editor

- **WHEN** a member opens an entry from a filtered later page and returns using the visible Back action or browser Back
- **THEN** the same collection, criteria, page, scroll position, and originating row are restored
- **AND** the return action does not introduce a list/editor loop in browser history

#### Scenario: Reload or open a copied cursor URL

- **WHEN** a member reloads a later page in the same tab
- **THEN** its current results and available previous-page context remain usable
- **WHEN** the member opens a copied later-page URL without a known cursor trail
- **THEN** that page can load and Next can continue if available
- **AND** the interface does not pretend to know its ordinal or immediate predecessor, and provides an explicit First page action

#### Scenario: Restore a different workspace or tab

- **WHEN** history crosses Catalog, Website, Images, Stock, Orders, or Review changes, including Details/Selling/Stock tabs and media mode
- **THEN** visible content, selected navigation, URL, and return destination agree
- **AND** stale editor content does not remain visible under a different collection or workspace address

### Requirement: Staff has a visible contextual way back

Every primary BlackBox staff workspace page other than Overview SHALL provide a visible, text-labeled `Back to <destination>` action in a consistent position near the task heading. Detail pages SHALL prefer the known originating staff task and its list context; a direct entry without a known origin SHALL use a meaningful parent. Catalog and Website list roots, Images, Stock, Orders, and Review changes SHALL fall back to Overview. Catalog editors SHALL fall back to their collection; Website singleton editors SHALL fall back to Pages or Navigation & footer as appropriate. New release, distro, and merch flows SHALL fall back to their corresponding catalog list. Order and stock details SHALL fall back to their respective lists.

Return targets SHALL remain within the current staff environment and recognized staff destinations. Invalid, external, or unavailable return metadata SHALL fall back safely. Existing URLs SHALL remain usable. Panels, dialogs, media pickers, and multi-step workflows SHALL retain their local Close, Cancel, or previous-step actions; those SHALL remain distinct from leaving the task.

#### Scenario: Work across the staff workspace

- **WHEN** a member opens an editor, item setup, stock detail, order detail, or review from another staff task
- **THEN** the visible Back label names its actual destination and returns to that task with applicable context
- **AND** top-level destinations offer Back to Overview when no supported origin is available

#### Scenario: Open a singleton or deep link directly

- **WHEN** a member opens Home page, Buying & delivery, Label details, a catalog entry, or an order in a new tab
- **THEN** a visible labeled parent action is available without relying on earlier browser history
- **AND** it does not leave the staff workspace for a previous external site

#### Scenario: Return through review or legacy item links

- **WHEN** Review changes opens an entry, or a supported legacy variant link resolves to its catalog editor
- **THEN** Back retains a valid known originating task, including review selection and browse position
- **AND** absent origin metadata uses the appropriate parent without losing the resolved item identity

#### Scenario: Close a nested surface

- **WHEN** a member closes Publication history or an image detail/picker, or goes to the preceding setup step
- **THEN** the member returns to the underlying task or step with focus and local work preserved
- **AND** closing that surface neither consumes an unrelated page-history entry nor activates the task-level Back action

### Requirement: Navigation protects pending work

Visible Back actions and staff navigation SHALL use the existing draft-save, conflict, stock-input, and operation-recovery protections. Editorial navigation SHALL wait for autosave to settle; a failure or conflict SHALL keep local input available and explain recovery. Stock and commerce actions SHALL NOT be submitted, repeated, or discarded by navigation. Declining to leave SHALL keep the current task, URL, focus, and recovery identity coherent. Full-document browser navigation SHALL retain the native unload protection where in-page interception is unavailable.

#### Scenario: Leave during autosave

- **WHEN** a member chooses Back while a draft save is pending or types again during that save
- **THEN** navigation waits until the latest local draft is saved through the existing serialized save path
- **AND** it navigates once without publishing the draft

#### Scenario: A save fails or conflicts

- **WHEN** Back or browser-history navigation encounters a failed or conflicting save
- **THEN** the editor and its latest input remain available with retry or the existing explicit resolution options
- **AND** canceling navigation restores a matching URL and UI without an automatic discard or history loop

#### Scenario: Leave stock, setup, or publication recovery

- **WHEN** a member attempts to leave entered stock counts, a pending item setup, or an operation with an uncertain result
- **THEN** existing leave/recovery protections and operation identities remain effective
- **AND** navigation alone does not record stock, create a price, repeat setup, publish content, or clear recovery state

### Requirement: Paging and return controls are accessible

Paging and return actions SHALL use native link/button behavior, visible text, keyboard activation, visible focus, and touch targets at least 44 CSS pixels high. Duplicated pagers SHALL have distinguishable navigation labels and identical enabled states. Controls and status text SHALL remain usable at 390, 768, 1280, and 1600 CSS pixels, at 200% zoom, and with reduced motion. No action SHALL require hover, a gesture, or icon recognition alone.

#### Scenario: Navigate with keyboard or a narrow viewport

- **WHEN** a member browses, advances a page, opens an item, and returns using only the keyboard at a supported width
- **THEN** controls fit without horizontal overflow, status changes are announced, and focus follows the successful transition
- **AND** failed requests retain the initiating control, while returning from a detail restores the originating row or list heading
- **AND** reduced motion does not prevent orientation or require an animation to complete

### Requirement: Editors offer an explicit current-item publish action

Content editors SHALL offer a prominent Publish changes action alongside review alternatives. Autosave SHALL remain private. The action SHALL finish saving the current item, retain its exact revision, and use the existing publication checks and recovery operation. It SHALL NOT publish unrelated drafts, automatically include required linked drafts, or replace an unconfirmed operation.

#### Scenario: Publish an edited or newly created item

- **WHEN** a member selects Publish changes with valid content and no incomplete upload
- **THEN** the current draft is saved and that exact saved revision is submitted once for publication
- **AND** the interface reports the confirmed publication status.

#### Scenario: Publication requires attention

- **WHEN** a linked draft is required, the saved revision changed, or a previous operation remains unconfirmed
- **THEN** the existing review or recovery interface explains the next action without automatically broadening or repeating the publication.

#### Scenario: Keep drafts for later

- **WHEN** a member keeps editing or chooses the review alternative
- **THEN** drafts remain private until an explicit publication action, and the global review queue remains reachable.

#### Scenario: Leave an unfinished creation

- **WHEN** a member leaves midway without selecting a final action
- **THEN** saved work remains a private draft available to resume
- **AND** reopening or recovering setup never publishes content or enables buying.

#### Scenario: Create an item ready for sale

- **WHEN** a member explicitly selects Create and publish after confirming price and starting stock
- **THEN** setup completes before the existing shop publication operation publishes content and enables buying
- **AND** failure or incomplete setup leaves the item unavailable to buy, with its draft and recovery state preserved.

### Requirement: Saved artist identity is visible before selection

The release editor SHALL resolve the saved artist independently of dropdown pagination and display its name before opening the picker. A delayed lookup SHALL NOT replace a subsequent selection.

#### Scenario: Saved artist is outside the first page

- **WHEN** a release references an artist absent from the first choices page
- **THEN** the picker shows that artist's resolved name without opening or paging the dropdown
- **AND** selecting another artist remains authoritative if the old lookup finishes later.

### Requirement: Shop publication is discoverable beside price editing

The Price & stock tab SHALL show shop publication status and available publication actions without expanding a disclosure. Price-saving and shop-publication actions SHALL explain their distinct effects using staff-facing language and preserve existing revision and readiness safeguards.

#### Scenario: A member changes a price

- **WHEN** a member saves a price and a further shop publication action is required
- **THEN** the resulting status and next action are visible near the top of the tab.

### Requirement: Catalogue search includes band identity

Staff catalogue search SHALL match album titles and their band or artist names, including linked release artists and distro credits. Matches SHALL remain reachable across bounded pages with current filters and draft privacy preserved.

#### Scenario: Find an album by its band

- **WHEN** a member searches for a band whose name is absent from its album title
- **THEN** matching releases and distro entries appear in the appropriate catalogue results, including beyond the first source page.

### Requirement: Bulk photos belong to one catalogue entry

Release and distro editors SHALL accept multiple images in one selection and append successful uploads in selection order to that entry's gallery. Existing images, cover, unrelated edits and successful uploads SHALL survive another file's failure. Validation and private media access SHALL remain enforced.

#### Scenario: One upload fails

- **WHEN** a batch includes valid images and a rejected file
- **THEN** successful images remain attached, the rejected file is identified, and retry does not duplicate successful attachments.

#### Scenario: Editor changes during upload

- **WHEN** a member edits other fields while images upload
- **THEN** completion preserves those edits and never attaches images to a different entry.

### Requirement: Image preview recovery preserves pending changes

Preview readiness SHALL reflect the images in the current rendering and SHALL preserve genuine loading failures as actionable errors. Retry SHALL retain saved drafts, exact review selection and the previous successful rendering.

#### Scenario: An image fails to load

- **WHEN** a saved review preview encounters an image loading failure
- **THEN** the member can retry without losing or publishing any pending changes.

#### Scenario: Return to an unchanged review

- **WHEN** a member switches applications or browser tabs and returns
- **THEN** the current successful preview and publish eligibility remain intact without a required review refresh
- **AND** publication still rejects changed server revisions.

#### Scenario: Open the standalone review

- **WHEN** the saved changes review displays a preview
- **THEN** its frame fills the available preview pane using the same layout styling as the editor.

### Requirement: Staff control the per-item copies-left notice

The protected stock detail SHALL provide a per-variant Show copies left switch backed by the stock record, defaulting to off for new and existing items. Writes SHALL be revision-checked and SHALL NOT alter quantities, restock intent or ledger entries.

#### Scenario: Enable the notice

- **WHEN** staff turns on Show copies left for the selected item
- **THEN** the stock record persists the flag and advances its revision
- **AND** the switch reflects the saved value.

#### Scenario: A concurrent stock update occurs

- **WHEN** the submitted stock revision is stale
- **THEN** the update is rejected, the stored flag is unchanged, and staff can refresh before retrying.

### Requirement: Release editing separates digital date and announced edition intent

The Staff Release editor SHALL label the existing album date Digital release date and explain that Upcoming can announce a forthcoming physical edition after digital release. Stage guidance SHALL keep preorder and stock controls separate in Selling, without changing schema, publication privacy or commerce authority.

#### Scenario: Staff maintains a digitally released album with future vinyl

- **WHEN** Staff configures Upcoming for a release whose music is digitally available but physical ordering has not opened
- **THEN** the editor explains that these states can coexist
- **AND** the existing digital date, stage, preorder and stock fields remain independently editable through their current workflows.

### Requirement: Initial staff styling avoids a separate private asset dependency

Project-owned stylesheet rules required to display the initial staff view SHALL arrive with the authenticated document, without requiring a separate project stylesheet response before that view can render. Styling used only by unopened optional features SHALL remain deferred. Document and asset authorization, private cache behavior, responsive layout, and accessible focus presentation SHALL remain effective.

#### Scenario: A private stylesheet response would be slow

- **WHEN** a member opens Overview, Website, Stock, or Orders
- **THEN** the initial document contains its required project styling and does not request a separate initial project stylesheet
- **AND** the initial payload does not include styles belonging only to unopened rich-text editors or image pickers.

#### Scenario: An optional feature is opened after startup

- **WHEN** a member opens an editor, picker, or publication history
- **THEN** the feature loads its required resources and presents styled, accessible controls
- **AND** direct editor URLs, private previews, and save or recovery behavior remain usable.
