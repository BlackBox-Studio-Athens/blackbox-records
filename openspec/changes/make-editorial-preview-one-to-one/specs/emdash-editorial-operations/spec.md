# Spec Delta

## MODIFIED Requirements

### Requirement: Staff editing remains accessible and task-first

The workspace SHALL provide content lists, forms, media selection, full-page interactive draft preview, publication status, and actionable errors using current BlackBox terminology and branding. Preview SHALL preserve the public page's presentation and safe behavior without giving that page staff or publication authority.

#### Scenario: Member uses a narrow screen or keyboard

- **WHEN** routine editing runs at 320 CSS pixels or with keyboard navigation
- **THEN** required controls remain visible without page-level horizontal overflow
- **AND** controls have accessible names, visible focus, error association, adequate contrast, and at least 44 by 44 CSS-pixel primary touch targets.

#### Scenario: Member previews a draft

- **WHEN** a member previews Home, About, Services, Artist, Release, Store Item, or News content
- **THEN** the complete public page shows the selected content and media with safe navigation, overlays, and player behavior
- **AND** staff controls identify it as private without changing the public page layout
- **AND** preview does not save, publish, deliver forms, or create checkout.

## ADDED Requirements

### Requirement: Preview uses native editorial selection and publication mapping

Preview SHALL use existing CMS identity, content, revision, reference, and media contracts. It SHALL compose the accepted same-environment snapshot with only the selected unsaved record or exact saved review selection of up to twenty entries. Media and Store Item identities SHALL follow publication's existing mapping rules. It SHALL NOT create another persistent draft store or publication protocol.

#### Scenario: Member previews unsaved input

- **WHEN** a member requests preview of validated browser input
- **THEN** that input replaces only the selected record over the accepted baseline
- **AND** unrelated drafts and native live revisions not accepted on the website remain excluded
- **AND** preview creates no saved revision, publication, or public media object.

#### Scenario: Member reviews a related batch

- **WHEN** saved related entries are selected for review
- **THEN** preview resolves those exact revisions, references, media, and canonical Store Item identities, including existing new-item fallback rules
- **AND** accepted media IDs retain the accepted immutable bytes while newly selected IDs use their native media
- **AND** existing saved-revision and baseline conflict checks remain enforced when publishing.

#### Scenario: Inputs change after rendering

- **WHEN** media, catalog setup, code, or surrounding content changes after a preview was rendered
- **THEN** refreshing or reopening preview loads the new inputs
- **AND** the earlier rendering represents its loaded selection rather than a guarantee about future publication with different inputs
- **AND** this does not disable existing publication conflict checks or transfer commerce authority to preview.

#### Scenario: Selected content cannot render

- **WHEN** required content, references, or media are missing or invalid
- **THEN** the existing error/retry flow explains the blocker and retains editor input
- **AND** preview does not invent missing data, fall back to repository fixtures, or save to obtain a rendering.

### Requirement: Preview uses the public page and navigation

For the same loaded content, code, viewport, and runtime data, preview SHALL match the public page's layout, typography, media, and safe interactions. It SHALL use public destinations for all editorial collections, including singleton/global content, listings, details, and overlays.

#### Scenario: Compare public and preview

- **WHEN** unchanged accepted content is rendered in both surfaces with matching inputs
- **THEN** the page presentation, hydrated controls, and supported interaction results agree
- **AND** missing regions, incorrect active navigation, wrong media/crops, and preview-only substitute widgets fail acceptance.

#### Scenario: Navigate within preview

- **WHEN** a member follows sections, detail overlays, search/filter controls, and Back/Forward
- **THEN** navigation retains that preview selection and the public shell's focus/scroll/player behavior
- **AND** Distro detail uses its canonical Store Item URL rather than the Distro listing pathname.

#### Scenario: Open a new rendering

- **WHEN** the member changes the selected input or opens a fresh preview
- **THEN** the new document uses the target's public renderer and matching assets
- **AND** page/overlay caches from a different selection are not reused.

### Requirement: Interactive preview remains private and read-only

Interactive preview SHALL run on a protected origin separate from staff and public origins. Private requests SHALL retain exact-host, verified-identity, and owner checks. The preview document SHALL NOT access staff DOM/storage, privileged APIs, or real checkout/delivery/publication operations.

#### Scenario: Use safe controls

- **WHEN** a member opens navigation, an overlay, search/filtering, a gallery, an approved music player, or the preview cart
- **THEN** the existing public controls work within the preview
- **AND** cart data remains in memory outside shopper storage and music begins only through ordinary user intent
- **AND** approved providers receive no preview credentials, context parameters, or referrer.

#### Scenario: Attempt a prohibited action

- **WHEN** preview attempts checkout, form delivery, CMS/publication/operational writes, BlackBox analytics, or unapproved external navigation
- **THEN** the action is blocked at the relevant client and server/network boundaries
- **AND** a user-triggered blocked action is explained without changing the settled page layout.

#### Scenario: Request private content without authority

- **WHEN** a request lacks the correct identity/hostname or uses another member's context
- **THEN** private output is denied before bytes or conditional-cache success
- **AND** draft responses are not stored in public, shared, or persistent offline caches.

#### Scenario: Send an unrelated frame message

- **WHEN** a message has the wrong origin, source window, context, or generation
- **THEN** it is ignored without disclosing content, changing readiness, or performing an operation.

### Requirement: Preview readiness tracks the loaded editor selection

Preview SHALL report ready only when the displayed generation matches the selected input and its required initial assets and interactions have initialized. It SHALL preserve existing responsive controls, accessible recovery, and suppression of superseded responses. Readiness SHALL describe the loaded selection without implying continuous verification of all external state.

#### Scenario: Edit or replace a rendering

- **WHEN** visible editing pauses for 750 ms, or the member opens, changes context, or retries preview
- **THEN** typing uses the existing debounce while open/context/retry begin immediately
- **AND** failed or late replacements cannot overwrite a newer generation or discard editor input
- **AND** the last good rendering remains available with an outdated/error indication when replacement fails.

#### Scenario: Resize or hide preview

- **WHEN** the member uses Fit, Desktop, Mobile, Expand, or visibility controls
- **THEN** actual viewport sizes and accessible focus behavior are preserved
- **AND** same-context edits retain scroll, destination changes follow public navigation behavior, and hidden previews stop background work/player activity
- **AND** reopening regenerates from the current editor selection.

#### Scenario: Restore cached navigation

- **WHEN** a member returns to a cached page within the same preview document
- **THEN** it retains that document's loaded selection without an additional global-freshness check
- **AND** any subsequent private request still validates identity and context lifetime.

### Requirement: Preview uses bounded temporary resources

Preview SHALL preserve existing input/output/read/deadline limits and use bounded expiring temporary state on existing hosting resources. It SHALL NOT require persistent preview sessions, background keepalive, automatic recovery loops, or paid capacity.

#### Scenario: Temporary state is lost or a bound is reached

- **WHEN** a context expires, its process restarts, authentication fails, or a request exceeds a configured bound
- **THEN** the next affected operation offers sign-in/regeneration/retry through the existing error flow
- **AND** editor input is retained and no public-content fallback, save, publication, or unbounded retry occurs.

### Requirement: Preview acceptance covers representative real behavior

Acceptance SHALL cover rendering for every supported collection and public-versus-preview comparisons for representative homepage, rich-text detail/overlay, and Store listing/detail views at mobile and desktop widths in Chromium and Firefox. Existing required editor viewport/accessibility checks SHALL remain in force. Validation SHALL reuse current tests and browser tooling.

#### Scenario: Verify parity and isolation

- **WHEN** the focused Local checks run with matching inputs
- **THEN** paired screenshots and content/interaction assertions detect layout, media, hydration, and selection differences
- **AND** focused boundary/failure checks establish draft privacy, denied writes, and usable recovery without repeating every case for every collection.

#### Scenario: Compare with actual publication

- **WHEN** an isolated Local fixture publishes a related reviewed batch containing media and Store Item identity changes while inputs remain unchanged
- **THEN** public output matches the reviewed preview
- **AND** explicit saves/publication are distinguished from preview-only operations, which do not mutate domain state.

#### Scenario: Prepare hosted rollout

- **WHEN** Local and repository/editor gates pass
- **THEN** UAT follows the existing Free-tier preflight and bounded smoke procedure
- **AND** PRD follows existing explicit promotion/configuration approval with catalog and checkout-launch gates intact.
