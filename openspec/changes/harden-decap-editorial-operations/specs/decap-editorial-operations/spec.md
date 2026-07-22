## ADDED Requirements

### Requirement: Decap remains the editorial content surface

The system MUST keep Decap limited to repository-owned public content and MUST keep operational commerce authority outside CMS fields and commits.

#### Scenario: Editor changes public content

- **WHEN** an editor changes an Artist, Release, Distro Store Item, News entry, page copy, navigation item, social link, newsletter copy, or site setting in Decap
- **THEN** Decap writes only the supported editorial fields and collection-owned media
- **AND** it does not expose Stripe Price IDs, amounts, currency authority, D1 identifiers, stock authority, checkout gates, order state, fulfillment state, provider credentials, or provider mutation controls.

#### Scenario: Editor needs a non-editorial operation

- **WHEN** an authenticated editor needs to change price, stock, stop-selling state, checkout availability, order state, or fulfillment state
- **THEN** the CMS identifies the existing authoritative operational surface or commerce-operator path
- **AND** it does not simulate that operation through editorial content deletion or hidden CMS fields.

### Requirement: Decap publishes directly to main

The system SHALL retain Decap simple publish mode against `main` and SHALL make the immediate publication consequence visible to editors.

#### Scenario: Editor publishes an entry

- **WHEN** an editor selects Publish for a valid Decap entry
- **THEN** Decap commits the content change directly to `main`
- **AND** the repository's normal content, catalog-artifact, and static deployment automation may start from that commit.

#### Scenario: Editor opens a collection or entry

- **WHEN** Decap presents a routine or advanced editing surface
- **THEN** it states concisely that publishing writes directly to `main`
- **AND** it does not present an Editorial Workflow draft/review board or imply that another CMS approval step exists.

### Requirement: Decap build mode is explicit

The system MUST support explicit `local`, `hosted`, and `disabled` Decap build modes and MUST NOT infer a localhost backend for a static production build.

#### Scenario: Local CMS development starts

- **WHEN** `pnpm cms:dev` starts the Astro editor and local proxy
- **THEN** Decap uses the proxy backend on the configured local port
- **AND** no DecapBridge login is required.

#### Scenario: Hosted static build has complete DecapBridge configuration

- **WHEN** UAT or full PRD selects hosted mode with all required DecapBridge endpoint values
- **THEN** `/admin/config.yml` contains the DecapBridge PKCE `git-gateway` backend, configured repository, and `main` branch
- **AND** it contains no placeholder site ID or localhost proxy URL.

#### Scenario: Hosted static build lacks required DecapBridge configuration

- **WHEN** hosted mode is selected and a required endpoint is blank or still contains a placeholder
- **THEN** the build or deterministic config validation fails with the missing variable names
- **AND** it does not print endpoint values, tokens, secrets, or a generated localhost fallback.

#### Scenario: Disabled CMS build is produced

- **WHEN** a secret-free static build or PRD Holding Page selects disabled mode
- **THEN** `/admin/` presents a branded unavailable state without initializing Decap
- **AND** the artifact does not emit a usable proxy or hosted authentication config.

### Requirement: Hosted authentication stays non-technical

The system SHALL keep hosted CMS authentication on DecapBridge PKCE with the existing social-login model and SHALL not require ordinary editors to understand GitHub.

#### Scenario: Label member opens hosted admin

- **WHEN** an invited label member opens the hosted `/admin/` route while signed out
- **THEN** the page presents the BlackBox CMS sign-in surface and DecapBridge social sign-in action
- **AND** it does not ask the editor for repository URLs, branches, GitHub tokens, or CMS username/password credentials.

#### Scenario: Authentication cannot initialize

- **WHEN** the hosted authentication runtime or Decap script cannot initialize
- **THEN** the boot surface replaces the indefinite loading state with a visible failure message
- **AND** it does not expose configuration values or internal stack traces.

### Requirement: Collection navigation prioritizes routine work

The system SHALL order and describe Decap collections by editing frequency and risk while retaining the current English language and domain terms.

#### Scenario: Editor opens the content sidebar

- **WHEN** the authenticated Decap content view loads
- **THEN** routine collections appear in this order: Home, Artists, Releases, Store Items — Distro & Merch, News, About, Services, Newsletter, and Store — Distro Page Copy
- **AND** Navigation, Social Links, and Site Settings appear afterward with an `Advanced` label.

#### Scenario: Editor opens an advanced collection

- **WHEN** an editor opens Navigation, Social Links, or Site Settings
- **THEN** the collection description warns that publication changes site-wide navigation, identity, or metadata directly on `main`
- **AND** the description distinguishes the advanced risk without implying a separate permission boundary.

#### Scenario: Existing CMS language is revised

- **WHEN** labels, hints, descriptions, or warnings are improved
- **THEN** they remain in English and preserve current BlackBox domain terminology
- **AND** they replace ambiguous technical wording with concise editor-facing wording rather than introducing a translation layer.

### Requirement: CMS controls match stored and rendered content

The system MUST expose only fields and controls that map to the current Astro schema and a supported stored or rendered behavior.

#### Scenario: Collection contract is audited

- **WHEN** a Decap collection builder is changed
- **THEN** every editable field maps to the corresponding Astro schema and current content shape
- **AND** every field that claims to affect public rendering has a current consumer or is removed from the CMS contract.

#### Scenario: Homepage editor loads

- **WHEN** an editor opens Home Content
- **THEN** the section controls expose only the currently rendered News and Artists sections
- **AND** obsolete Distro and Journey section types do not appear in config, schema, preview, or new saved content.

#### Scenario: Closed values are reused

- **WHEN** Astro and Decap require the same distro groups, slug pattern, or other closed validation value
- **THEN** the implementation uses one shared value where the module boundary permits it
- **AND** a focused test fails if the editor options and runtime schema diverge.

### Requirement: Fixed-layout page sections cannot be structurally corrupted

The system MUST prevent Decap from adding, removing, duplicating, or reordering fixed-layout Home, About, and Services sections that the public renderer resolves by known type.

#### Scenario: Editor changes a fixed page section

- **WHEN** an editor expands Home, About, or Services sections
- **THEN** the editor can change the fields inside each existing named section
- **AND** add, remove, and reorder controls are unavailable for the fixed section list.

#### Scenario: Editor changes a genuinely repeatable list

- **WHEN** an editor changes paragraphs, links, videos, credits, service items, process steps, bullets, contact rows, stats, formats, or similar ordered content
- **THEN** the list retains the add, remove, and reorder controls supported by its public rendering
- **AND** each item has a clear singular add label and collapsed summary.

### Requirement: Fields provide editor-facing validation

The system SHALL use native Decap widgets and constraints to reject predictable invalid content before a direct-to-main publish.

#### Scenario: Editor enters a constrained value

- **WHEN** an editor enters a slug, internal path, external URL, email address, YouTube ID, provider URL, integer order, or date
- **THEN** Decap applies the same practical format constraint as the runtime schema
- **AND** the field hint includes a concise valid example where the format is not obvious.

#### Scenario: Editor selects a Release artist

- **WHEN** an editor creates or updates a Release
- **THEN** the Artist field searches the current Artists collection through a relation widget
- **AND** it stores the canonical artist entry identity expected by Astro references without a hand-maintained build-time option list.

#### Scenario: Editor supplies key public imagery

- **WHEN** an editor creates or updates Home, Artist, Release, Distro, News, About, or Services imagery
- **THEN** the image field explains its expected crop or role
- **AND** descriptive alt text is required after legacy omissions are backfilled.

#### Scenario: Editor browses a large collection

- **WHEN** an editor opens Artists, Releases, Distro, or News
- **THEN** the collection provides useful singular labels, summaries, and sort fields
- **AND** Distro provides a group view or filter that reduces scanning across the full catalog.

### Requirement: Stable content identities are protected from CMS deletion

The system MUST prevent routine Decap deletion where an entry participates in references, stable public routes, catalog projection, or operational retirement.

#### Scenario: Editor opens Artist, Release, or Distro actions

- **WHEN** an editor views an existing Artist, Release, or Distro entry
- **THEN** Decap does not offer a delete action
- **AND** the editor is directed to the appropriate maintainer or commerce operation when an item must be retired or corrected structurally.

#### Scenario: Editor opens disposable editorial content

- **WHEN** an editor views News or an Advanced Social Link entry
- **THEN** the existing confirmed delete action may remain available
- **AND** fixed file entries and fixed Navigation entries remain non-deletable.

#### Scenario: Store Item must stop selling

- **WHEN** a Distro or Release-derived Store Item must stop selling but remain editorially visible
- **THEN** the CMS guidance directs the editor to protected stock or commerce-operator checkout controls
- **AND** it does not instruct the editor to delete the content entry.

### Requirement: CMS media paths form one safe contract

The system MUST preserve collection-owned images and MUST make every visible Decap media path resolvable, safe, and compatible with Astro image fields.

#### Scenario: Editor uploads through a collection image field

- **WHEN** an editor uploads or selects an image for Home, About, Services, Artist, Release, Distro, or News content
- **THEN** the asset is saved beside the owning content entry using its collection media settings
- **AND** the stored path remains valid for the corresponding Astro `image()` field.

#### Scenario: Preview requests an existing collection asset

- **WHEN** a custom preview resolves a collection-relative asset
- **THEN** `/admin/media/<collection>/<asset>` serves the allowlisted source with the correct content type and cache policy
- **AND** it rejects unknown collections, unsupported file types, missing files, and path traversal.

#### Scenario: Top-level media surface is available

- **WHEN** Decap exposes the top-level Media surface or global uploads folder
- **THEN** every presented asset can be selected without producing an invalid collection field path
- **AND** stale mirrored duplicates are removed or the misleading top-level surface is hidden or limited without breaking collection image widgets.

#### Scenario: Editor previews a newly selected image

- **WHEN** an image field contains a new blob/data asset or a newly saved collection-relative path
- **THEN** the registered preview renders that image or an explicit media fallback
- **AND** it does not emit a broken `/admin/` URL caused by an unresolved media path.

### Requirement: Key public previews reflect the current site

The system SHALL retain representative custom previews for current public content and SHALL keep preview controls understandable and accessible.

#### Scenario: Key preview registrations initialize

- **WHEN** Decap finishes manual initialization
- **THEN** Home, Artists, Releases, Distro, and News preview templates are registered as the required subset
- **AND** the existing About and Services preview templates remain available unless their public collection is removed by a separate approved change.

#### Scenario: Home preview renders

- **WHEN** an editor changes Home content
- **THEN** the preview represents the current Hero, News, and Artists content hierarchy
- **AND** it does not display obsolete Distro or Journey homepage sections.

#### Scenario: Editor toggles preview

- **WHEN** an entry editor opens
- **THEN** the preview may start collapsed to preserve editing width
- **AND** one keyboard-accessible control clearly reports whether the preview is hidden or visible and allows the editor to change that state.

#### Scenario: Preview rendering fails

- **WHEN** a preview cannot resolve optional data or media
- **THEN** it renders a bounded fallback without crashing the editor
- **AND** it does not allow an indefinite boot screen to hide the failure.

### Requirement: Decap runtime versions and custom patches are controlled

The system MUST pin the Decap browser runtime and local proxy package to one tested compatibility baseline and MUST bound custom DOM-dependent repairs.

#### Scenario: Dependency baseline is installed

- **WHEN** this change is implemented against the July 22, 2026 baseline
- **THEN** the browser runtime is pinned to `decap-cms@3.14.1` and local proxy tooling to `decap-server@3.9.1`
- **AND** package metadata, lockfile, admin script URL, and tests agree on those exact versions.

#### Scenario: Decap runtime cannot load

- **WHEN** the exact pinned browser script fails to load or initialize within the allowed boot interval
- **THEN** the admin route shows a branded error state with a retry action
- **AND** the Local or UAT smoke reports the failed runtime initialization.

#### Scenario: Custom admin repair is retained

- **WHEN** implementation retains a class-name or DOM-shape-dependent mutation in `public/admin/init.js`
- **THEN** a focused regression check demonstrates the user-visible defect it repairs on the pinned Decap version
- **AND** the repair fails safely when its target element is absent.
