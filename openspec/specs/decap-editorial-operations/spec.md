# decap-editorial-operations Specification

## Purpose

Define how Decap provides safe, usable editorial access to repository-owned public content while publishing directly to `main` and keeping commerce authority outside the CMS.

## Requirements

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

The system SHALL keep hosted CMS authentication on DecapBridge PKCE, direct ordinary editors to the shared label Google account, and SHALL not require them to understand GitHub or claim the repository controls hosted DecapBridge provider choices.

#### Scenario: Label member opens hosted admin

- **WHEN** a label member opens the hosted `/admin/` route while signed out
- **THEN** the BlackBox-owned page presents concise CMS guidance to use the shared label Google account and one understandable action that continues to DecapBridge
- **AND** it does not ask for repository URLs, branches, GitHub tokens, or a BlackBox CMS username and password.

#### Scenario: Hosted provider page is displayed

- **WHEN** DecapBridge presents its hosted provider-selection page
- **THEN** BlackBox acceptance treats Google, Microsoft, or password options on that external page as DecapBridge-owned behavior
- **AND** repository tests do not claim those alternatives are absent unless the authentication platform is explicitly changed in a later change.

#### Scenario: Shared account is used

- **WHEN** one of the two to three editors signs in with the shared Google account
- **THEN** the CMS grants the same Decap content access and direct-to-`main` behavior
- **AND** the interface does not imply individual roles, approval levels, or per-person attribution that the shared identity cannot provide.

#### Scenario: Authentication cannot initialize

- **WHEN** the hosted authentication runtime or Decap script cannot initialize
- **THEN** the boot surface replaces the indefinite loading state with a visible failure message and retry action
- **AND** it does not expose configuration values or internal stack traces.

### Requirement: Collection navigation prioritizes routine work

The system SHALL order and describe Decap collections by confirmed editing frequency and risk while retaining the current English language and domain terms.

#### Scenario: Editor opens the content sidebar

- **WHEN** the authenticated Decap content view loads
- **THEN** collections appear in this order: Store Items — Distro & Merch, Releases, Artists, News, Site Pages, Advanced — Navigation, Advanced — Social Links, and Advanced — Site Settings
- **AND** Store Items and Releases are visible before lower-frequency content and site-wide controls.

#### Scenario: Editor opens Site Pages

- **WHEN** an editor opens the native Site Pages file collection
- **THEN** collection `site-pages` contains `home-site`, `about-site`, `services-site`, `newsletter-site`, and `distro-page-site` in that order without changing their stored files
- **AND** each entry has one clear label, one description, and canonical route `#/collections/site-pages/entries/<file-id>` rather than a separate top-level sidebar collection.

#### Scenario: Editor opens a Site Pages singleton route

- **WHEN** an editor opens one of the canonical `site-pages` entry routes
- **THEN** file-specific preview registration continues to use the unchanged file ID
- **AND** singleton loading protection, smoke navigation, and route tests use the new collection name and exact entry ID.

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

- **WHEN** an editor opens Home in Site Pages
- **THEN** the editor exposes named Hero, News, and Artists objects matching the public hierarchy
- **AND** obsolete Distro and Journey section types and fixed-section list controls do not appear in config, schema, preview, or saved content.

#### Scenario: Closed values are reused

- **WHEN** Astro and Decap require the same distro groups, slug pattern, or other closed validation value
- **THEN** the implementation uses one shared value where the module boundary permits it
- **AND** a focused test fails if the editor options and runtime schema diverge.

### Requirement: Fixed-layout page sections cannot be structurally corrupted

The system MUST model fixed-layout Home, About, and Services sections as named object fields rather than editor-controlled section lists.

#### Scenario: Editor changes a fixed page section

- **WHEN** an editor opens Home, About, or Services in Site Pages
- **THEN** the editor can change fields inside each named section object
- **AND** no add, remove, duplicate, type-select, or reorder control exists for the fixed page structure.

#### Scenario: Existing fixed-page content is migrated

- **WHEN** the named object model is introduced
- **THEN** committed Home, About, and Services content preserves the current public values under the new object keys
- **AND** Astro schemas, queries, renderers, previews, and tests stop accepting the old section arrays and `type` discriminators in the same change.

#### Scenario: Editor changes a genuinely repeatable list

- **WHEN** an editor changes paragraphs, links, videos, credits, service items, process steps, bullets, contact rows, stats, formats, or similar ordered content
- **THEN** the list retains the add, remove, and reorder controls supported by its public rendering
- **AND** each item has a clear singular add label and collapsed summary.

### Requirement: Fields provide editor-facing validation

The system SHALL use native Decap widgets and constraints to reject predictable invalid content before a direct-to-main publish and to shorten high-frequency forms.

#### Scenario: Editor enters a constrained value

- **WHEN** an editor enters an editor-visible slug, internal path, external URL, email address, YouTube ID, provider URL, integer order, or date
- **THEN** Decap applies the same practical format constraint as the runtime schema
- **AND** the field hint includes a concise valid example where the format is not obvious.

#### Scenario: Editor selects a Release artist

- **WHEN** an editor creates or updates a Release
- **THEN** the Artist field searches the current Artists collection through a relation widget
- **AND** it stores the canonical artist entry identity expected by Astro references without a hand-maintained build-time option list.

#### Scenario: Editor supplies key public imagery

- **WHEN** an editor creates or updates Home, Artist, Release, Store Item, News, About, or Services imagery
- **THEN** the image field explains its expected crop or role and uses a single collection-owned image control without arbitrary URL entry
- **AND** descriptive alt text is required wherever the corresponding Astro schema requires it, while an inventory-complete content tree is not rewritten without an actual gap.

#### Scenario: Editor browses a large collection

- **WHEN** an editor opens Artists, Releases, Store Items, or News
- **THEN** the collection provides useful singular labels, summaries, and sort fields
- **AND** Store Items provide native group views and current-group filters that reduce scanning across the full catalog.

#### Scenario: Editor changes a bounded list

- **WHEN** a list has schema-owned minimum or maximum item counts
- **THEN** Decap receives both valid `min` and `max` values when native limit enforcement is intended
- **AND** one-sided limits that Decap cannot enforce are not presented as protection.

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

- **WHEN** an editor uploads, selects, or replaces an image for Home, About, Services, Artist, Release, Store Item, or News content
- **THEN** the asset is saved beside the owning content entry using its collection media settings
- **AND** the stored path remains valid for the corresponding Astro `image()` field.

#### Scenario: Preview requests an existing collection asset

- **WHEN** a custom preview resolves a collection-relative asset
- **THEN** `/admin/media/<collection>/<asset>` serves the allowlisted source with the correct content type and cache policy
- **AND** it rejects unknown collections, unsupported file types, missing files, and path traversal.

#### Scenario: Top-level media surface is available

- **WHEN** Decap would expose the top-level Media surface or global uploads folder
- **THEN** the surface is absent unless every presented asset can be selected into a valid collection-owned image field
- **AND** collection image widgets continue to support upload, selection, replacement, and preview.

#### Scenario: Editor previews a newly selected image

- **WHEN** an image field contains a new blob/data asset or a newly saved collection-relative path
- **THEN** the registered preview renders that image or an explicit media fallback
- **AND** it does not emit a broken `/admin/` URL caused by an unresolved media path.

### Requirement: Key public previews reflect the current site

The system SHALL retain representative custom previews for current public content and SHALL use supported preview registration and control behavior.

#### Scenario: Key preview registrations initialize

- **WHEN** Decap finishes manual initialization
- **THEN** Home, Artists, Releases, Store Items, and News preview templates are registered as the required subset
- **AND** Home, About, and Services file previews remain registered by unchanged file IDs through collection `site-pages`.

#### Scenario: Home preview renders

- **WHEN** an editor changes Home content
- **THEN** the preview represents the named Hero, News, and Artists objects in the current public hierarchy
- **AND** it does not depend on the removed section array or display obsolete Distro or Journey sections.

#### Scenario: Editor toggles preview

- **WHEN** an entry editor opens
- **THEN** one keyboard-accessible native control clearly reports whether preview is hidden or visible and changes that state
- **AND** narrow viewports prioritize form width without a timed synthetic click or generated-class repair.

#### Scenario: Preview rendering fails

- **WHEN** a preview cannot resolve optional data or media
- **THEN** it renders a bounded fallback without crashing the editor
- **AND** the ready boot surface remains absent so the failure is visible.

### Requirement: Decap runtime versions and custom patches are controlled

The system MUST pin the Decap browser runtime and local proxy package to one tested compatibility baseline and MUST minimize custom DOM-dependent behavior.

#### Scenario: Dependency baseline is installed

- **WHEN** this change is implemented against the July 24, 2026 baseline
- **THEN** the browser runtime is pinned to `decap-cms@3.16.0` and local proxy tooling to `decap-server@3.11.0`
- **AND** package metadata, lockfile, admin script URL, tests, and compatibility notes agree on those exact versions.

#### Scenario: Decap runtime cannot load

- **WHEN** the exact pinned browser script fails to load or initialize within the allowed boot interval
- **THEN** the admin route shows a branded error state with a retry action
- **AND** the Local or UAT smoke reports the failed runtime initialization.

#### Scenario: Existing repair inventory is reconciled

- **WHEN** the 3.16.0 redesign evaluates the current admin repair registry
- **THEN** every repair has the design's explicit disposition: native replacement, deletion, characterization-gated deletion or retention, or named no-native exception
- **AND** direct-to-`main` guidance, singleton blank-publication protection, preview accessibility, saved singleton navigation, and Media suppression are not silently lost.

#### Scenario: Custom admin repair is retained

- **WHEN** implementation retains behavior outside generated configuration and supported Decap registration APIs
- **THEN** a focused regression check demonstrates the required user-visible behavior on the pinned Decap version and the adjustment fails safely when its semantic target is absent
- **AND** the implementation targets an app-owned mount, stable route, or semantic attribute without observing the whole document for the CMS session, depending on generated class names, or synthesizing timed editor actions.

#### Scenario: Superseded repair registry is removed

- **WHEN** the 3.16.0 redesign is complete
- **THEN** the body-wide observer, fixed-list repair, timed preview collapse, editor scope panel, aggregate registry, and other superseded legacy behavior are deleted
- **AND** the singleton guard, Media suppression, or any characterization-proven exception that remains is individually named, route- or mount-scoped, justified by a missing native option, and covered by its focused test.

### Requirement: Ready state removes the boot surface

The system MUST mount Decap in an app-owned `#nc-root`, automatically remove the separate boot surface after that mount renders its first child, and MUST NOT require editor interaction to reveal the CMS.

#### Scenario: Decap initializes successfully

- **WHEN** local or hosted Decap has been initialized and `#nc-root` contains its first rendered child
- **THEN** the boot root is removed or hidden before the Decap-owned surface accepts input
- **AND** it contributes no viewport height, focus target, live-region announcement, or duplicate visible content.

#### Scenario: Decap initialization has not rendered

- **WHEN** `CMS.init()` has returned but `#nc-root` remains empty
- **THEN** the bounded loading state remains visible until the mount renders or the initialization timeout fails
- **AND** returning from `CMS.init()` alone does not mark the admin ready.

#### Scenario: Boot readiness observer completes

- **WHEN** the CMS mount renders, initialization fails, times out, retries, or is disposed
- **THEN** the child-list observer scoped to `#nc-root` disconnects
- **AND** no boot lifecycle observer watches `document.body` or remains active for the CMS session.

#### Scenario: Admin is disabled or initialization fails

- **WHEN** the admin route is disabled or Decap cannot render within the allowed interval
- **THEN** the corresponding bounded disabled or failed boot state remains visible with a retry action when applicable
- **AND** only the ready state suppresses the boot surface.

### Requirement: Routine Store Item and Release workflows are task-first

The system SHALL make creating a Store Item, adding or replacing its image, and creating a Release the shortest routine Decap workflows.

#### Scenario: Editor creates a Store Item

- **WHEN** an editor opens Store Items — Distro & Merch and selects the singular create action
- **THEN** identity, classification, image, alt text, and public summary fields appear before lower-frequency presentation metadata
- **AND** no price, stock, checkout, order, fulfillment, Stripe, or D1 authority appears in the form.

#### Scenario: Editor adds or replaces a Store Item image

- **WHEN** an editor uses the Store Item image field on desktop or mobile
- **THEN** the native image control supports collection-owned upload, selection, replacement, preview, and validation without requiring a repository path
- **AND** arbitrary URL entry and multiple-image selection are unavailable for the single-image field.

#### Scenario: Editor creates a Release

- **WHEN** an editor opens Releases and selects the singular create action
- **THEN** title, Artist relation, cover image, alt text, release date, formats, and public copy follow the editor's task order
- **AND** optional or repeatable details use clear labels and summaries without obscuring required fields.

### Requirement: Artist slugs are generated without editor input

The system MUST generate a new Artist's public slug through the shared repository slug library, MUST preserve existing Artist slugs, and MUST NOT expose Artist slug editing in Decap.

#### Scenario: Editor creates an Artist

- **WHEN** an editor creates an Artist with a title and no stored slug
- **THEN** Decap shows no Slug field or override action, uses its native title identifier for the new entry filename, and generates the stored public slug through the shared slug library before save
- **AND** the generated slug satisfies the runtime slug format without requiring editor input.

#### Scenario: Editor changes an existing Artist title

- **WHEN** an existing Artist has a nonblank stored slug and an editor changes its title or other content
- **THEN** the stored public slug and existing entry filename remain unchanged
- **AND** the published Artist URL does not change as a side effect of routine editorial work.

#### Scenario: Maintainer supplies an explicit Artist slug

- **WHEN** a maintainer sets an explicit Artist slug directly in repository source
- **THEN** Decap round-trips that hidden value without replacing or exposing it
- **AND** repository validation rejects an invalid or colliding override before the content is accepted.

### Requirement: Admin branding and controls remain legible

The system MUST scope BlackBox admin styles so Decap composite controls retain their native structure, required actions remain readable, and the authenticated header presents clear BlackBox branding.

#### Scenario: Authenticated header renders

- **WHEN** the Decap content view is authenticated and ready
- **THEN** the existing horizontal BlackBox wordmark is visibly dark on the light header and the Contents route remains readable as text
- **AND** the native document icon is absent without a generated-class selector or document-wide observer.

#### Scenario: Composite selection control renders

- **WHEN** a select, relation, group, or filter control renders an internal combobox input
- **THEN** the internal input does not receive the outer text-field height, border, radius, padding, or shadow
- **AND** the trigger, selected value, dropdown indicator, and focus state remain aligned and readable.

#### Scenario: Required action renders

- **WHEN** a create, publish, quick-add, navigation, retry, or other required action is shown
- **THEN** actionable foreground and background meet WCAG 2.2 AA text contrast in default, hover, focus, and active states, while disabled states remain legible and visibly distinct
- **AND** no blanket link or button foreground override replaces the action's semantic color.

#### Scenario: Standalone Local CMS loads assets

- **WHEN** the standalone Local CMS launcher serves the admin route
- **THEN** the page, display link, logo, and other configured admin assets use the active CMS origin on `127.0.0.1`, while the local proxy uses the same hostname on its configured proxy port
- **AND** the local header logo loads successfully without changing hosted URLs.

### Requirement: Decap supports mobile editorial work

The system MUST keep routine collection discovery, entry editing, image handling, validation, preview control, and publication actions usable at mobile widths.

#### Scenario: Editor uses a narrow viewport

- **WHEN** the authenticated editor is rendered at 320 CSS pixels or wider
- **THEN** the active collection or entry has no page-level horizontal overflow and no clipped required action
- **AND** labels, values, validation messages, and action states remain readable.

#### Scenario: Editor performs a top task on mobile

- **WHEN** an editor starts a Store Item or Release, opens an existing Store Item image field, or toggles preview on a mobile viewport
- **THEN** primary workflow actions and standalone icon controls have at least a 44 by 44 CSS-pixel target, an accessible name, and visible keyboard focus
- **AND** the editor is not required to switch to desktop, use hover, or recover a horizontally clipped action to complete the content form.

### Requirement: Decap configuration uses current native options

The system SHALL prefer current Decap configuration and supported extension APIs over custom DOM repair code.

#### Scenario: Admin configuration is generated

- **WHEN** local or hosted Decap configuration is produced
- **THEN** branding uses the current `logo` object, Markdown-backed rich content uses the current rich-text widget, and list limits use valid paired `min` and `max` values
- **AND** deprecated `logo_url`, deprecated Markdown widget declarations, and ineffective one-sided list limits are absent.

#### Scenario: Markdown-backed content is edited

- **WHEN** an existing Markdown body is loaded and saved through the current rich-text widget
- **THEN** the stored content remains valid Markdown accepted by the Astro collection
- **AND** every committed Artist and News Markdown body present at implementation time round-trips without destructive changes to its existing headings, paragraphs, lists, links, emphasis, code, or other stored semantics.

#### Scenario: Native Decap behavior is insufficient

- **WHEN** a required behavior has no supported Decap configuration or extension API
- **THEN** the implementation may retain the smallest bounded semantic adjustment with a focused regression test
- **AND** it does not use a document-wide session observer, generated-class contract, or timed synthetic editor action.
