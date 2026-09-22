# Staff workspace delta

## MODIFIED Requirements

### Requirement: Staff startup loads only immediately needed features

The initial staff view SHALL avoid loading rich-text editing and publication-history features until the corresponding feature is opened. Shared labels and navigation metadata SHALL remain usable without importing those features. Website Pages and catalog list views SHALL also exclude feature-specific code and styles for unopened editors, media pickers, and selling/stock editors. Shared UI primitives and read-only catalog summaries SHALL remain available. Existing save, conflict, recovery, and navigation behavior SHALL be preserved.

#### Scenario: Member opens a routine workspace

- **WHEN** a member opens Overview, Stock, or Orders with history closed
- **THEN** initial loading does not request rich-text editor JavaScript, its feature-specific styles, or publication-history JavaScript
- **AND** opening history or an editor subsequently loads and displays that feature with accessible loading and error feedback.

#### Scenario: Member browses Website or Catalog

- **WHEN** a member opens Pages, Releases, or Distro without opening an editor or picker
- **THEN** the browse view becomes usable without downloading code or styles specific to those closed editing features
- **AND** displayed catalog summaries still include their existing publication and selling information
- **AND** subsequently opening an editor loads its required styles and controls before presenting usable editing fields.

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

### Requirement: Staff performance acceptance distinguishes local proof from hosted results

Performance acceptance SHALL record repeatable request, rendering, and resource evidence for the same deployed revision and documented network conditions. Acceptance SHALL NOT require measurements from a specific country. Local or UAT checks alone SHALL NOT establish that the PRD latency issue is resolved. Acceptance SHALL retain individual slow and failed visits and SHALL distinguish initial resources, warm resources, changing ingress conditions, usable data and completed artwork.

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

#### Scenario: Free-tier operation or infrastructure assumptions are unproven

- **WHEN** a pilot would exceed reviewed account allowance or the proposed infrastructure change lacks request attribution
- **THEN** affected hosted probing stops and local work or retained evidence is used
- **AND** no paid plan, new resource, or existing database/object relocation is inferred from the performance task
- **AND** an edge location or a best-effort location hint is not reported as proof of application or data placement.

## ADDED Requirements

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
