# emdash-editorial-operations Specification

## Purpose

Provide self-hosted editorial content management within the BlackBox staff workspace while preserving existing public content, access controls, and recoverable media.

## Requirements

### Requirement: One staff workspace uses one verified identity

Label members SHALL manage content, Store Items, stock, and orders from one BlackBox-owned workspace using their existing allowlisted sign-in. CMS and commerce authorization SHALL enforce the same verified person and target environment.

#### Scenario: Member moves between tasks

- **WHEN** a permitted member moves from a News draft to an item, stock, or order
- **THEN** the workspace retains navigation and identity without another GitHub, Stripe, or CMS login
- **AND** server-side permissions remain required for every read and write.

#### Scenario: Request bypasses the protected hostname

- **WHEN** an internal or CMS request arrives without a valid target-specific identity through an alternate hostname, forged email header, expired token, wrong audience, or wrong issuer
- **THEN** it is rejected before reading private content or performing route work.

#### Scenario: Browser attempts a forged write

- **WHEN** a cross-origin request, stale revision, unauthorized role, or tampered payload attempts a mutation
- **THEN** the server rejects it without partial field updates or privilege escalation
- **AND** the member can reload current data and retry an authorized action.

### Requirement: Editorial fields retain their supported meaning

CMS editing SHALL cover every existing public content collection and fixed page structure while preserving references, stable slugs, rich-text meaning, validation, media descriptions, and deletion restrictions. The editor SHALL expose actionable validation beside the affected field before a save or publication request, while the server SHALL remain the final authority for content validity and reference/media existence.

#### Scenario: Member formats editorial prose

- **WHEN** a member formats descriptions, biographies, video descriptions, introductions, stories, quotations, service details/contact notes, newsletter copy or purchase/privacy wording
- **THEN** the native EmDash editor retains supported paragraphs, breaks, inline marks, lists, quotations, alignment and safe links through autosave, preview, publication, cards and related-item displays
- **AND** formatting-only edits are visible in publication review
- **AND** unsupported blocks and unsafe links receive validation feedback
- **AND** card navigation and description links remain independently keyboard accessible.

#### Scenario: Legacy prose is edited or cleared

- **WHEN** an existing scalar prose field has a native optional `_rich` companion
- **THEN** present rich content is authoritative, including an empty array for deliberate clearing
- **AND** missing or null rich content uses the legacy string
- **AND** opening the editor does not save a conversion or synchronize two stored representations
- **AND** nested prose accepts legacy strings or Portable Text without a bulk migration.

#### Scenario: A plain-text consumer reads formatted prose

- **WHEN** completeness checks, metadata, search, accessible labels or commerce integrations require text
- **THEN** they derive plain text from the authoritative prose at read time
- **AND** names, headings, labels, identifiers, URLs, contact details, image alternatives and operational audit notes remain strings, preserving line breaks where applicable.

#### Scenario: Existing content migrates

- **WHEN** Artists, Releases, Distro, News, page copy, purchase information, navigation, social links, newsletter copy, and settings are imported
- **THEN** record counts, source identities, links, dates, ordering, media, and rendered semantics reconcile against the source inventory
- **AND** migration neither drops optional fields nor invents missing content or prices.

#### Scenario: Member edits a referenced record

- **WHEN** an Artist title changes or a Release selects an Artist
- **THEN** the persisted stable identity and public slug survive title changes
- **AND** relations use existing records rather than duplicate manually maintained choices.

#### Scenario: Member attempts destructive content work

- **WHEN** a member edits an Artist, Release, Store Item, fixed page, or fixed navigation entry
- **THEN** ordinary editing does not offer hard deletion
- **AND** News and social-link deletion retains confirmation and reference safety
- **AND** stop-selling and archive actions preserve order and stock history.

#### Scenario: Invalid content is submitted directly

- **WHEN** a request bypasses form constraints for a URL, slug, reference, date, image, bounded list, or required field
- **THEN** server validation rejects it with actionable field errors
- **AND** arbitrary scripts, executable markup, unsafe embeds, and unsupported fields cannot enter rendered content.

#### Scenario: Member enters invalid content in the editor

- **WHEN** a required value is blank, a constrained value is malformed, or a nested row is invalid
- **THEN** the affected field exposes an associated error and invalid state
- **AND** Save and Publish do not send a mutation until all current fields pass the shared content validation rules.

#### Scenario: Member discards edits

- **WHEN** a member has unsaved changes and selects Discard changes
- **THEN** the workspace asks for confirmation before replacing or clearing the edited values
- **AND** canceling preserves values and focus
- **AND** confirming a saved record reloads its saved revision while confirming a new record returns to the collection list without saving.

### Requirement: Staff editing remains accessible and task-first

The workspace SHALL provide content lists, forms, media selection, full-page interactive draft preview, publication status, and actionable errors using current BlackBox terminology and branding. Content, Images, Items, Stock, and Orders SHALL use a consistent staff workspace hierarchy with task-specific headings, compact operational controls, semantic status treatments, and responsive layouts. Every editable Content field SHALL expose semantic labels, associated validation messages, visible invalid state, and keyboard-reachable focus. Preview SHALL preserve the public page's presentation and safe behavior without giving that page staff or publication authority.

#### Scenario: Member uses a narrow screen or keyboard

- **WHEN** routine editing runs at 320 CSS pixels or with keyboard navigation
- **THEN** required controls remain visible without page-level horizontal overflow
- **AND** controls have accessible names, visible focus, error association, adequate contrast, and at least 44 by 44 CSS-pixel primary touch targets.

#### Scenario: Member previews a draft

- **WHEN** a member previews Home, About, Services, Artist, Release, Store Item, or News content
- **THEN** the complete public page shows the selected content and media with safe navigation, overlays, and player behavior
- **AND** staff controls identify it as private without changing the public page layout
- **AND** preview does not save, publish, deliver forms, or create checkout.

#### Scenario: Member fixes an invalid field

- **WHEN** a member corrects the field associated with a validation error
- **THEN** the field error clears when the current content is valid
- **AND** the first invalid field can be reached by the form's validation focus behavior without losing other edits.

#### Scenario: Member moves between staff workspaces

- **WHEN** a member moves between Content, Images, Items, Stock, and Orders
- **THEN** the workspace keeps consistent heading hierarchy, spacing, action placement, status language, loading feedback, and focus treatment
- **AND** each workspace retains its current data ownership, permissions, and direct links.

#### Scenario: A workspace read or operation is pending

- **WHEN** a member opens, refreshes, searches, or submits an operation in a staff workspace
- **THEN** the affected region shows a named loading or pending state without hiding unrelated usable data
- **AND** duplicate unsafe actions are disabled until the operation settles.

#### Scenario: A workspace read or operation fails

- **WHEN** a staff read or operation fails
- **THEN** the workspace preserves safe last-known context where applicable, shows an actionable error with text and an icon or status treatment, and leaves an accessible retry or recovery action available
- **AND** it does not invent identifiers, statuses, quantities, order facts, or publication results.

### Requirement: Distro galleries remain schema-backed editorial content

The EmDash Distro editing surface SHALL expose the optional ordered secondary-image list as CMS-owned editorial media and SHALL require alt text for every secondary image.

#### Scenario: Editor adds a secondary Distro image

- **WHEN** an editor adds a gallery entry to a Distro Store Item
- **THEN** the editor supplies one CMS-owned image and required image alt text
- **AND** the saved object matches the shared content-model schema
- **AND** the primary `image` field remains separate and required.

#### Scenario: Editor leaves the gallery empty

- **WHEN** a Distro item has no secondary images
- **THEN** the optional gallery field may be omitted
- **AND** the saved entry remains valid without an empty placeholder object.

#### Scenario: Editor manages gallery media

- **WHEN** the editor reorders or removes secondary images
- **THEN** the stored order controls detail-page presentation
- **AND** the controls do not expose remote runtime image URLs, Stripe fields, stock fields, or provider mutation settings.

#### Scenario: Gallery edits are saved before publication

- **WHEN** an editor saves or previews changed Distro media
- **THEN** public gallery output retains the accepted snapshot until selected publication through Items succeeds
- **AND** failed publication preserves that snapshot without promoting unrelated drafts.

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

### Requirement: Content and media survive application replacement

Editorial records and media SHALL live outside application bundles and Git commits. Complete private backup and restore evidence SHALL exist before the old writable CMS is retired.

#### Scenario: Worker is redeployed

- **WHEN** a Software Release deploys unchanged or updated code
- **THEN** existing CMS records, users, revisions, media, prices, stock, and orders are preserved
- **AND** seed fixtures do not overwrite populated databases.

#### Scenario: Editorial recovery is rehearsed

- **WHEN** a backup is restored into isolated recovery resources
- **THEN** users, content, relations, required revisions, and referenced media are recoverable and reconciled
- **AND** restoring editorial data cannot roll back paid orders, stock, or Stripe bindings.

#### Scenario: Public media storage is inspected

- **WHEN** an anonymous visitor requests media or a guessed backup path
- **THEN** only intentionally public assets are accessible
- **AND** database exports, unpublished media, credentials, and private backups are inaccessible.

### Requirement: Hosting cost and supported integration are acceptance gates

The integrated CMS SHALL use supported extension and authentication interfaces and SHALL be accepted against the actual account's free-tier limits. Paid capacity or an upstream fork SHALL NOT be an implicit fallback.

#### Scenario: CMS execution exceeds the entry Worker CPU allowance

- **WHEN** supported CMS operations exceed the Workers Free per-request CPU limit
- **THEN** the same backend deployment MAY host the supported handler in a SQLite-backed Durable Object available on Workers Free, with one object for the editorial site
- **AND** Access verification precedes private CMS operations inside the object; private static files and prepared display thumbnails are served directly by the entry Worker after equivalent hostname, identity, and permission checks
- **AND** commerce remains on its existing path and D1/R2 retain their ownership
- **AND** acceptance measures entry Worker CPU and object CPU, requests, and duration separately without relying on burst tolerance or enabling a paid plan
- **AND** revision conflicts remain enforced in D1 rather than relying on object serialization.

#### Scenario: A bounded dependency correction is required

- **WHEN** the authorized version-pinned patch corrects the reproduced stale-revision race
- **THEN** a clean install applies the reviewed patch and concurrent HTTP saves prove that the losing request cannot overwrite the winner
- **AND** every permitted staff mutation retains server-side validation and conflict protection, including rejection of unsupported write shapes before partial updates
- **AND** the patch is removed when an upstream version passes the same checks, without maintaining a separate CMS fork or lock service.

#### Scenario: Integration or resource proof fails

- **WHEN** the selected package versions cannot support required authentication, headless editing, Worker composition, or representative free-tier operation
- **THEN** implementation stops before migration cutover with evidence and a decision request
- **AND** the existing working system remains available.

### Requirement: Static staff delivery retains authorization and cache boundaries

Every private staff HTML, script, style, and font response SHALL require the same target-specific verified identity as the staff workspace. Static delivery SHALL remain independent of CMS database initialization and editorial object execution. Existing mandatory revalidation and no-store categories SHALL remain in force.

#### Scenario: Authorized member requests a build asset

- **WHEN** an authorized member requests staff HTML or a build asset using GET or HEAD
- **THEN** the file is served without invoking the editorial object or querying a database
- **AND** eligible fingerprinted assets retain private mandatory revalidation while HTML and ineligible responses remain private and no-store
- **AND** the request creates no session cookie or storage write.

#### Scenario: An invalid identity supplies a matching validator

- **WHEN** a missing, expired, wrong-issuer, wrong-audience, or alternate-host identity requests a private asset with a matching conditional validator
- **THEN** the response denies access before returning private bytes or a not-modified response
- **AND** the denial is private and no-store.

#### Scenario: A non-static route reaches the same deployment

- **WHEN** a public API, internal commerce API, CMS operation, publication workflow, or supported token export reaches the deployment
- **THEN** it retains its existing route, method restrictions, and credential checks
- **AND** a static-file shortcut does not admit unsupported CMS routes or writes.

### Requirement: Compact staff media has private bounded derivatives

Compact staff images SHALL use prepared, private display derivatives of at most 96 pixels on either axis and 40 KiB per image. Derivatives SHALL be regenerable from retained originals, SHALL NOT change editorial references or publication authority, and SHALL NOT require a paid image service.

#### Scenario: A normal staff image upload succeeds

- **WHEN** the native media upload succeeds with a valid display thumbnail
- **THEN** a derivative is stored against the native returned storage identity
- **AND** the original, CMS identity, and normal upload result retain their existing meaning
- **AND** a derivative-storage failure does not report the successful original upload as failed or silently publish media.

#### Scenario: A member reads a prepared derivative

- **WHEN** an authorized member requests an existing derivative using GET or HEAD
- **THEN** the response contains only the prepared image or its metadata and remains private and no-store
- **AND** reading it does not generate an image, write storage, query a database, or invoke the editorial object
- **AND** anonymous and invalid-identity requests cannot read it.

#### Scenario: A derivative is missing or invalid

- **WHEN** no valid derivative exists, its key is malformed, or its stored size exceeds the permitted bound
- **THEN** no original-image fallback or runtime transformation is served through the derivative route
- **AND** compact views show a stable placeholder without disrupting the surrounding task.

#### Scenario: Existing media needs preparation

- **WHEN** an operator prepares derivatives for existing media
- **THEN** the operation defaults to a bounded read-only dry run, supports explicit resumable batches, and skips existing valid derivatives
- **AND** apply changes only derivative objects in the selected environment without altering originals, CMS records, snapshots, stock, or orders
- **AND** hosted reads and writes require the existing account-wide Free-tier budget review and a bounded pilot before further batches.
