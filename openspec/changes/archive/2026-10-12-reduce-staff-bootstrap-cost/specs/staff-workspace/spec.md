# Staff workspace delta

## ADDED Requirements

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

## MODIFIED Requirements

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
