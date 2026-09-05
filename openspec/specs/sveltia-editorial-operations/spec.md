# sveltia-editorial-operations Specification

## Purpose

Define safe, usable Sveltia access to repository-owned public content while preserving direct publishing and keeping commerce authority outside the CMS.

## Requirements

### Requirement: Sveltia remains the editorial content surface

The system MUST keep Sveltia limited to repository-owned public content and MUST keep operational commerce authority outside CMS fields and commits.

#### Scenario: Editor changes public content

- **WHEN** an editor changes an Artist, Release, Distro Store Item, News entry, page copy, navigation item, social link, newsletter copy, or site setting in Sveltia
- **THEN** Sveltia writes only supported editorial fields and collection-owned media
- **AND** it does not expose Stripe Price IDs, amount or currency authority, D1 identifiers, stock authority, checkout gates, order state, fulfillment state, provider credentials, or provider mutation controls.

#### Scenario: Editor needs a non-editorial operation

- **WHEN** an editor needs to change price, stock, stop-selling state, checkout availability, order state, or fulfillment state
- **THEN** the CMS identifies the existing authoritative operator surface
- **AND** it does not simulate the operation through content deletion or hidden CMS fields.

### Requirement: Publishing consequences are explicit

The system SHALL keep hosted publishing in simple mode against `main` and SHALL distinguish hosted publishing from local working-tree saves.

#### Scenario: Hosted editor publishes an entry

- **WHEN** the designated GitHub account publishes a valid entry
- **THEN** Sveltia commits the content change directly to `main`
- **AND** the repository's normal content, catalog-artifact, and static deployment automation may start from that commit.

#### Scenario: Local editor saves an entry

- **WHEN** a local editor selects the repository directory and saves a valid entry
- **THEN** Sveltia writes the change to that working tree without creating or pushing a Git commit
- **AND** the editor uses the normal Git workflow to review, commit, and push the change.

#### Scenario: Editor opens an editing surface

- **WHEN** Sveltia presents a routine or advanced collection
- **THEN** the interface states the applicable hosted or local publication consequence concisely
- **AND** it does not present an Editorial Workflow board or imply another CMS approval step.

### Requirement: CMS access mode is explicit

The system MUST support explicit `local`, `hosted`, and `disabled` Sveltia modes and MUST NOT infer writable production fallback configuration.

#### Scenario: Local CMS development starts

- **WHEN** `pnpm cms:dev` serves `/admin/index.html` in a supported Chromium browser
- **THEN** Sveltia offers its native local-repository directory flow
- **AND** no local proxy, hosted OAuth, or provider credential is required.

#### Scenario: Hosted build has complete configuration

- **WHEN** UAT or PRD selects hosted mode with a valid authenticator URL
- **THEN** the admin configuration identifies the fixed GitHub repository, `main`, and hosted authenticator
- **AND** site and asset URLs follow the existing Astro site/base configuration without placeholders or localhost fallback.

#### Scenario: Hosted build lacks required configuration

- **WHEN** hosted mode is selected and `SVELTIA_AUTH_BASE_URL` is blank or a placeholder
- **THEN** configuration generation fails with that variable name
- **AND** it does not print configured values or secrets.

#### Scenario: Disabled CMS build is produced

- **WHEN** a static artifact selects disabled mode
- **THEN** `/admin/` presents a branded unavailable state without loading Sveltia
- **AND** `/admin/config.yml` emits no writable backend configuration.

### Requirement: Hosted authentication uses one designated GitHub identity

The system SHALL authenticate hosted editing through GitHub OAuth using one designated GitHub CMS account with repository write access.

#### Scenario: Editor opens hosted admin while signed out

- **WHEN** an editor opens hosted `/admin/`
- **THEN** Sveltia presents its native GitHub OAuth sign-in surface without injected login controls
- **AND** BlackBox operator guidance identifies the designated account as the supported identity, without adding Google, DecapBridge, personal access token, hosted repository-selection, branch-selection, or CMS-password instructions.

#### Scenario: The designated account lacks repository access

- **WHEN** GitHub authentication succeeds but the account cannot write to the configured repository
- **THEN** the editor receives a clear access error
- **AND** the CMS does not claim that authentication alone grants content access.

#### Scenario: A hosted entry is committed

- **WHEN** an editor publishes through the designated account
- **THEN** the commit uses that GitHub account's identity
- **AND** Sveltia adds no user directory, roles, or per-editor attribution layer.

### Requirement: Collection controls match stored and rendered content

The system MUST preserve collection/file identities, editorial meaning, and fixed-layout controls while using native-compatible stored keys. It MUST expose only controls that map to the migrated Astro schemas and supported stored or rendered behavior.

#### Scenario: Editor opens the collection list

- **WHEN** the authenticated content view loads
- **THEN** collections appear in this order: Store Items — Distro & Merch, Releases, Artists, News, Site Pages, Advanced — Navigation, Advanced — Social Links, and Advanced — Site Settings
- **AND** labels, descriptions, hints, and warnings remain concise English using current BlackBox domain terms.

#### Scenario: Editor opens Site Pages

- **WHEN** an editor opens the `site-pages` file collection
- **THEN** it contains `home-site`, `about-site`, `services-site`, `newsletter-site`, and `distro-page-site` in that order using their existing files and canonical routes
- **AND** Home, About, and Services expose named fixed-layout objects rather than addable, removable, duplicable, or reorderable section lists.

#### Scenario: Collection contract changes

- **WHEN** an editor field or option is added or changed
- **THEN** it maps to the corresponding Astro schema and current content shape
- **AND** stale CMS-only fields, removed fixed-section types, commerce-authority fields, and unsupported Sveltia options remain absent.

#### Scenario: Distro shelf introduction keys migrate

- **WHEN** the Distro page copy is migrated for native field-name compatibility
- **THEN** `group_intros` stores `vinyl_12_inch`, `vinyl_10_inch`, and `vinyl_7_inch` instead of `Vinyl 12-inch`, `Vinyl 10-inch`, and `Vinyl 7-inch`, respectively
- **AND** the corresponding text and visible field labels remain unchanged, as do the `CDs`, `Clothes`, `Tapes`, and `Other` keys
- **AND** the editor retains fixed named text fields, not an arbitrary key/value editor
- **AND** Distro item `group` values, public routes, shelf labels, ordering, membership, and rendered intro text remain unchanged, including the combined 7-inch/10-inch shelf's use of the 7-inch intro.

#### Scenario: Optional field is left blank

- **WHEN** an optional editor field has no value
- **THEN** Sveltia omits the empty field where required for schema compatibility
- **AND** the saved entry remains accepted by the Astro content collection.

#### Scenario: Markdown content round-trips

- **WHEN** an existing Artist or News Markdown body is loaded and saved
- **THEN** it remains valid Markdown accepted by Astro
- **AND** existing headings, paragraphs, lists, links, emphasis, code, and other stored semantics are preserved.

### Requirement: Native controls protect content validity and stable identity

The system SHALL use supported Sveltia fields and constraints for practical validation and MUST preserve stable public identities.

#### Scenario: Editor enters a constrained value

- **WHEN** an editor enters a visible slug, internal path, external URL, email address, YouTube ID, provider URL, integer order, date, or bounded list
- **THEN** the editor applies the practical constraint used by the runtime schema
- **AND** non-obvious formats include a concise valid example.

#### Scenario: Editor selects a Release artist

- **WHEN** an editor creates or updates a Release
- **THEN** the Artist field searches the Artists collection and stores the identity expected by the Astro reference
- **AND** it does not rely on a hand-maintained duplicate option list.

#### Scenario: Editor opens deletion actions

- **WHEN** an editor opens an Artist, Release, Distro item, fixed file entry, or fixed Navigation entry
- **THEN** the CMS does not offer deletion
- **AND** News and Advanced Social Link entries retain their existing confirmed deletion behavior.

#### Scenario: Editor creates an Artist

- **WHEN** an editor creates an Artist with a title and no stored public slug
- **THEN** no Slug field is shown and the stored slug is generated through the shared repository slug library before save
- **AND** existing or source-supplied Artist slugs survive title edits and Sveltia round trips unchanged.

### Requirement: Media and previews use Sveltia-native paths

The system MUST keep collection-owned media safe and SHALL retain the seven current custom preview outcomes through supported Sveltia APIs.

#### Scenario: Native media configuration initializes

- **WHEN** local or hosted Sveltia initializes its asset storage
- **THEN** the global Asset Library uses existing shared public assets with an absolute public path appropriate to the deployment base
- **AND** collection/file media overrides retain their existing relative stored paths without moving assets or changing collection upload ownership.

#### Scenario: Editor changes a collection image

- **WHEN** an editor uploads, selects, or replaces an image through its collection field
- **THEN** the asset is saved beside the owning content entry with a path accepted by the corresponding Astro `image()` field
- **AND** a newly uploaded filename is normalized to the existing path-safe convention.

#### Scenario: Preview requests an asset

- **WHEN** a custom preview renders existing or newly selected media
- **THEN** it resolves the value through Sveltia's supplied `getAsset` function
- **AND** optional or invalid values render a bounded fallback without a custom admin-media route.

#### Scenario: Public catalog images no longer depend on CMS routing

- **WHEN** the static site builds Distro and Release catalog images
- **THEN** Astro emits their original bytes at base-aware `/assets/catalog/<collection>/<filename>` paths
- **AND** Store image overrides and generated catalog projections use those paths without a CMS dependency
- **AND** source media stays in place, old image URLs receive no compatibility route, and the migration does not change commerce authority or mutate live provider data.

#### Scenario: Preview registrations initialize

- **WHEN** Sveltia initializes
- **THEN** Home, About, Services, Artists, Releases, Store Items, and News previews are registered through supported extension APIs using the existing Site Pages file IDs
- **AND** the implementation adapts preview props only where required rather than adding a compatibility adapter.

#### Scenario: Editor opens the Asset Library

- **WHEN** Sveltia exposes its native Asset Library
- **THEN** the CMS leaves that native surface intact
- **AND** normal collection editing continues to use collection-owned image fields and paths.

### Requirement: Runtime integration stays small and controlled

The system MUST use one exact tested Sveltia runtime version and MUST prefer supported configuration and extension APIs over provider-specific repair code.

#### Scenario: Admin initializes

- **WHEN** local or hosted `/admin/index.html` loads valid configuration and the pinned runtime
- **THEN** the bootstrap registers the required extensions and calls `CMS.init()`
- **AND** Sveltia owns the editing surface without a parallel app-owned ready-state controller.

#### Scenario: Configuration or runtime cannot load

- **WHEN** the generated configuration or pinned runtime request fails
- **THEN** the static admin document shows one concise reload instruction
- **AND** it does not start a timeout, retry controller, observer, or alternate CMS.

#### Scenario: Native configuration validation fails

- **WHEN** Sveltia rejects generated configuration
- **THEN** its native configuration errors remain visible and editing is unavailable
- **AND** the integration does not bypass validation, silently repair fields, or switch to another writable configuration.

#### Scenario: Supported extension APIs cover existing behavior

- **WHEN** previews, preview styles, or the Artist pre-save transformation are registered
- **THEN** the integration uses Sveltia's supported APIs
- **AND** Decap-specific login injection, generated-class selectors, body-wide observers, timed actions, custom media routing, and compatibility layers are absent.

### Requirement: Routine workflows remain task-first and accessible

The system MUST keep common editorial tasks usable on desktop and at mobile widths while retaining BlackBox branding.

#### Scenario: Editor creates a Store Item or Release

- **WHEN** an editor starts a Store Item or Release
- **THEN** identity, relation, imagery, alt text, date, classification, and public copy fields follow the current task-first order
- **AND** no price, stock, checkout, order, fulfillment, Stripe, or D1 authority appears.

#### Scenario: Editor uses a narrow viewport

- **WHEN** the authenticated editor is rendered at 320 CSS pixels or wider
- **THEN** collection navigation, forms, image controls, validation, preview controls, and publish actions have no page-level horizontal overflow or clipped required action
- **AND** primary actions and standalone icon controls have accessible names, visible keyboard focus, and at least 44 by 44 CSS-pixel targets.

#### Scenario: Admin chrome and controls render

- **WHEN** the authenticated content view is ready
- **THEN** the BlackBox wordmark, navigation, native composite controls, and required actions remain readable and structurally intact
- **AND** actionable text meets WCAG 2.2 AA contrast in default, hover, focus, and active states.
