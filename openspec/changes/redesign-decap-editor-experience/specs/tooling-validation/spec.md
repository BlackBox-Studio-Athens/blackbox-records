## ADDED Requirements

### Requirement: Rendered Decap usability is validated across desktop and mobile

The system MUST validate the redesigned editor through rendered task flows in the native Codex Browser Use surface, with automated checks remaining read-only.

#### Scenario: Desktop task walkthrough runs

- **WHEN** Local CMS is checked at a desktop viewport
- **THEN** the check opens Store Items first, starts a new Store Item, exercises image selection or replacement without publishing, and starts a new Release
- **AND** it verifies visible required actions, field order, validation, preview control, boot dismissal, and zero unexpected console or page errors.

#### Scenario: Mobile task walkthrough runs

- **WHEN** the same representative flows are checked at 390 CSS pixels and the responsive floor is inspected at 320 CSS pixels
- **THEN** `document.documentElement.scrollWidth` does not exceed `clientWidth`, and collection navigation, forms, image controls, validation, preview controls, and action bars have no horizontally clipped required action
- **AND** primary workflow actions and standalone icon controls have at least 44 by 44 CSS-pixel targets, accessible names, visible keyboard focus, and no dependency on hover, desktop width, or interaction with the boot surface.

#### Scenario: Owner accepts the UAT editor

- **WHEN** the exact implementation commit is deployed to UAT
- **THEN** an owner performs a no-publish walkthrough of Store Item creation, Store Item image work, and Release creation using the shared Google account
- **AND** unresolved task-blocking usability defects prevent the change from being marked complete.

## MODIFIED Requirements

### Requirement: Generated Decap configuration is structurally validated

The system MUST parse and validate generated Decap YAML for every supported backend mode instead of relying only on fragment assertions.

#### Scenario: Decap config tests run

- **WHEN** `pnpm test:cms-admin` or the web unit suite runs
- **THEN** tests parse the generated YAML for `local`, `hosted`, and `disabled` behavior
- **AND** they verify backend type, repository, branch, publish mode, shared-Google guidance without provider-exclusivity claims, site/display URL, collection-owned media settings, exact collection order, canonical `site-pages` identity and routes, file-entry order and descriptions, summaries, sorts, groups, filters, native image options, current branding options, and exact runtime version inputs.

#### Scenario: Boot lifecycle tests run

- **WHEN** the boot controller and admin initialization tests execute
- **THEN** returning from `CMS.init()` while `#nc-root` is empty retains loading, and the first rendered mount child produces ready state and removes the boot surface
- **AND** tests cover defensive `[hidden]` CSS, timeout, retry, stale-attempt rejection, and observer cleanup on success, failure, retry, and disposal.

#### Scenario: Deprecated or ineffective config returns

- **WHEN** generated configuration contains `logo_url`, a deprecated Markdown widget declaration, a one-sided list limit, arbitrary URL entry on a collection-owned image, or a superseded collection order
- **THEN** deterministic validation fails
- **AND** the failure identifies the collection and option.

#### Scenario: Hosted config contains unsafe fallback data

- **WHEN** a generated hosted config contains `127.0.0.1`, a placeholder site ID, blank required endpoint, or proxy backend
- **THEN** deterministic validation fails
- **AND** failure output names the violated setting without printing secret values.

### Requirement: Decap collection contracts have focused parity checks

The system MUST test the editor structure that can create direct-to-main content.

#### Scenario: Collection builder tests run

- **WHEN** Decap collection tests execute
- **THEN** they verify exact collection names, file IDs, file descriptions, canonical routes, collection and file order, field names and order, widgets, requiredness, native constraints, relation settings, image options, list controls, summaries, sort/group/filter options, preview paths, and deletion policy for each collection
- **AND** they fail when a stale CMS-only field, deprecated option, removed fixed-section type, or commerce-authority field returns.

#### Scenario: Site Pages route contracts change

- **WHEN** the page singletons move to collection `site-pages`
- **THEN** tests prove the unchanged file IDs map to `#/collections/site-pages/entries/<file-id>`, file-specific previews remain registered, and singleton protection recognizes those routes
- **AND** old Home, About, Services, Newsletter, or Distro Page collection routes are absent from active config, runtime mappings, and smoke fixtures.

#### Scenario: Shared closed values change

- **WHEN** Store Item groups, slug constraints, or another shared closed value changes
- **THEN** tests prove Astro schema acceptance and Decap options remain aligned
- **AND** current committed content still passes `pnpm check`.

#### Scenario: Fixed-layout page contracts change

- **WHEN** Home, About, or Services builders or schemas change
- **THEN** tests prove the exact named object keys are present and the old fixed-section arrays and type discriminators are absent
- **AND** tests prove genuinely repeatable nested lists retain the intended native controls.

#### Scenario: Rich-text widget changes

- **WHEN** Markdown-backed fields move to the current rich-text widget
- **THEN** every committed Artist and News Markdown body present at implementation time round-trips as valid content without destructive changes to semantics present in that fixture
- **AND** Astro accepts the resulting content.

#### Scenario: Repair disposition tests run

- **WHEN** the admin runtime is simplified for 3.15.1
- **THEN** focused tests cover every repair named in the design disposition table and prove each deleted behavior has a native or structural replacement where required
- **AND** retained exceptions are individually named, bounded to an app-owned mount or matching route, safe when targets are absent, and free of generated-class and timed-click contracts.

### Requirement: Decap media routes and previews are tested together

The system MUST cover collection image options, media allowlists, route safety, and preview asset resolution with deterministic checks.

#### Scenario: Admin media route tests run

- **WHEN** the admin media route is tested
- **THEN** tests cover every configured media root, supported extension, content type, cache header, missing asset, unknown collection, and traversal attempt
- **AND** the route never reads outside the approved Astro content directories.

#### Scenario: Preview asset resolver tests run

- **WHEN** preview runtime tests exercise existing paths, blobs, data URLs, strings, asset objects, and invalid admin URLs
- **THEN** supported assets resolve to a renderable URL
- **AND** unsupported values produce a bounded fallback rather than a broken editor.

#### Scenario: Collection image controls are checked

- **WHEN** generated collection image fields are tested
- **THEN** single-image fields disable arbitrary URL entry and multiple selection while retaining upload, browse, replace, and preview behavior
- **AND** their media and public-folder paths remain compatible with the owning Astro `image()` field.

#### Scenario: Global media inventory is checked

- **WHEN** the implementation would retain a top-level uploads library
- **THEN** a check proves every visible asset can be selected into a valid collection-owned field
- **AND** otherwise the misleading global surface is absent without breaking collection image widgets.

### Requirement: Local CMS Smoke covers representative editor behavior

The system SHALL keep Local CMS Smoke read-only and SHALL cover the highest-frequency editor tasks at desktop and mobile widths.

#### Scenario: Local CMS Smoke runs

- **WHEN** `pnpm smoke:cms-local -- --screenshots never` runs
- **THEN** it starts explicit local mode, verifies automatic boot dismissal, and loads representative Home, Artist, Release, Store Item, and News editors
- **AND** it opens new Store Item and Release forms through semantic role/name queries, selects an existing collection image without saving or publishing, verifies current values, canonical Site Pages routes, preview registrations, direct-to-main notice, mobile layout, and zero unexpected console or page errors.

#### Scenario: Local CMS Smoke completes

- **WHEN** the Local CMS Smoke exits
- **THEN** before/after content-file hashes and `git status --porcelain` prove it has not written content files, created Git commits, or mutated provider state, and the run has not selected Save or Publish
- **AND** all spawned Astro/proxy/browser processes terminate cleanly with the smoke exit status.

### Requirement: UAT Static Smoke verifies hosted Decap safety

The system SHALL verify deployed hosted-mode Decap without authenticating or publishing content.

#### Scenario: UAT CMS admin smoke runs

- **WHEN** `pnpm smoke:uat-static -- --scenario cms_admin` targets the GitHub Pages UAT site
- **THEN** it verifies the branded loading surface, truthful automatic transition to hosted DecapBridge sign-in, shared-Google guidance on the BlackBox-owned surface, exact pinned Decap runtime initialization, DecapBridge PKCE config, `main` branch, and absence of placeholders, localhost URLs, repository credential prompts, and leaked secrets
- **AND** it records failures as UAT Static Smoke evidence.

#### Scenario: UAT CMS asset smoke runs

- **WHEN** `pnpm smoke:uat-static -- --scenario cms_assets` targets the GitHub Pages UAT site
- **THEN** it verifies representative Home, Artist, Release, Store Item, News, and supported collection-media assets through their admin URLs
- **AND** it remains read-only and separate from Provider Smoke or Promotion Evidence.

### Requirement: Decap upgrades pass repository gates

The system MUST validate the exact final Decap tree with focused, rendered, and repository-wide checks.

#### Scenario: Decap implementation is ready for UAT

- **WHEN** implementation tasks are complete
- **THEN** `pnpm test:cms-admin`, `pnpm smoke:cms-local -- --screenshots never`, `pnpm test:unit`, `pnpm check`, and `pnpm build` pass against the exact final tree
- **AND** Browser Use validates the desktop and mobile task walkthroughs while the generated secret-free local build presents disabled rather than localhost-backed CMS behavior.

#### Scenario: Hosted Decap is accepted

- **WHEN** the implementation commit deploys to UAT
- **THEN** `cms_admin` and `cms_assets` UAT Static Smoke scenarios pass for that deployed commit
- **AND** the owner completes the no-publish Google-authenticated task walkthrough before the change is marked complete.
