# Spec Delta

## ADDED Requirements

### Requirement: Staff startup loads only immediately needed features

The initial staff view SHALL avoid loading rich-text editing and publication-history features until the corresponding feature is opened. Shared labels and navigation metadata SHALL remain usable without importing those features. Existing save, conflict, recovery, and navigation behavior SHALL be preserved.

#### Scenario: Member opens a routine workspace

- **WHEN** a member opens Overview, Stock, or Orders with history closed
- **THEN** initial loading does not request rich-text editor JavaScript, its feature-specific styles, or publication-history JavaScript
- **AND** opening history or an editor subsequently loads and displays that feature with accessible loading and error feedback.

#### Scenario: Member navigates with unsaved or recovering work

- **WHEN** content autosave is pending, a save conflicts or fails, or a stock/order action is recovering
- **THEN** existing save-before-leave, conflict, and recovery protection remains effective
- **AND** performance changes neither discard work nor satisfy authoritative reads from newly introduced persistent caches.

### Requirement: Overview panels become usable independently

Each Overview panel SHALL expose its own loading, success, empty, or error state without waiting for unrelated panels. Responses from a superseded page activation SHALL NOT replace current data.

#### Scenario: Order summary is slow or unavailable

- **WHEN** the content workspace and publication reads succeed while the order summary remains pending or fails
- **THEN** drafts and publication information become usable as their own reads finish
- **AND** only the order panel remains loading or shows its error and retry state.

### Requirement: Compact catalog and stock artwork has a bounded payload

Catalog and stock rows displaying small artwork SHALL request private display thumbnails rather than original images. An initial view of 25 such images SHALL transfer at most 1 MiB of encoded image bodies in total, excluding HTTP headers, and SHALL preserve image descriptions and reserved layout dimensions.

#### Scenario: Stock contains high-resolution covers

- **WHEN** 25 rows reference multi-megabyte originals
- **THEN** row rendering requests only bounded derivatives and never downloads those originals implicitly
- **AND** absent or failed thumbnails produce fixed-size placeholders without retry loops or layout shifts.

### Requirement: Staff performance acceptance distinguishes local proof from hosted results

Performance acceptance SHALL record repeatable request, rendering, and resource evidence for the same deployed revision. Greek-network measurements SHALL establish the target-user result; measurements made through another country's network SHALL be labeled accordingly. Local checks alone SHALL NOT establish that the hosted latency issue is resolved.

#### Scenario: An optimized candidate is assessed

- **WHEN** the candidate completes local functional and performance checks
- **THEN** an authorized bounded hosted pilot separately records HTML and asset response timing, time to usable content, image bytes, request counts, and relevant Worker and storage usage
- **AND** the evidence includes browser/network conditions, connection location, cache state, revision, sample count, and the median and range for small samples
- **AND** slow or incomplete results remain visible instead of being converted into a performance pass.

#### Scenario: Free-tier operation or geographic assumptions are unproven

- **WHEN** a pilot would exceed reviewed account allowance or further location investigation is needed
- **THEN** affected hosted probing stops and local work or retained evidence is used
- **AND** no paid plan, new resource, or existing database/object relocation is inferred from the performance task
- **AND** an edge location or a best-effort location hint is not reported as proof of Greek execution or data placement.
