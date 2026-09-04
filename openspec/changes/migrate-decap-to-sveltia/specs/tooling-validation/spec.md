## ADDED Requirements

### Requirement: Generated Sveltia configuration is structurally validated

The system MUST parse and validate generated Sveltia configuration for every supported mode.

#### Scenario: CMS configuration tests run

- **WHEN** `pnpm test:cms-admin` or the web unit suite runs
- **THEN** tests verify local, hosted, and disabled modes; the fixed repository and `main`; publish mode; hosted authenticator URL; Astro-derived site URLs; output and media behavior; absolute global public media paths; native-compatible field names; exact collection order; and runtime version
- **AND** generated output contains no Git Gateway, DecapBridge, proxy, placeholder, leaked secret, `allow_multiple`, `options_length`, or other unsupported retained option.

#### Scenario: Required hosted configuration is missing

- **WHEN** hosted mode has a blank or placeholder `SVELTIA_AUTH_BASE_URL`
- **THEN** deterministic configuration generation fails with that variable name
- **AND** no configured value or secret is printed.

#### Scenario: Static deployment wiring changes

- **WHEN** hosted workflow configuration is checked
- **THEN** it supplies only `SVELTIA_BACKEND_MODE` and `SVELTIA_AUTH_BASE_URL` for CMS behavior
- **AND** changes under `apps/web/src/lib/admin/**` are not excluded from static deployment triggering.

### Requirement: Sveltia collection contracts have focused parity checks

The system MUST test the editor structure that can create direct-to-`main` content without duplicating the complete Astro schema suite.

#### Scenario: Collection contract tests run

- **WHEN** CMS collection tests execute
- **THEN** they verify collection and file identities, ordering, fields, requiredness, supported constraints, relations, media options, summaries, sort/group/filter options, preview registrations, and deletion policy
- **AND** they fail when a stale CMS-only field, removed fixed-section type, commerce-authority field, or unsupported Sveltia option returns.

#### Scenario: Shared content rules change

- **WHEN** shared closed values, fixed-layout objects, Markdown fields, or Artist slug behavior changes
- **THEN** focused tests prove the CMS output remains accepted by Astro and preserves existing public identities
- **AND** current committed content still passes `pnpm check`.

#### Scenario: Distro copy-key migration is checked

- **WHEN** the focused content and CMS checks run after the migration
- **THEN** the committed Distro page JSON, generated CMS fields, Astro schema, and rendered-copy consumers agree on the new `vinyl_12_inch`, `vinyl_10_inch`, and `vinyl_7_inch` keys
- **AND** the old space-containing copy keys are absent while field labels, other copy keys, intro text, Distro item `group` values, and shelf behavior remain unchanged.

### Requirement: Sveltia previews and media paths are tested together

The system MUST cover collection-owned media paths, Sveltia preview asset resolution, and the seven preview registrations with focused checks.

#### Scenario: Media and preview tests run

- **WHEN** CMS media and preview tests execute
- **THEN** they cover the existing shared global asset folder and its Local/UAT/PRD public paths, collection-relative media overrides, uploaded filename normalization, existing paths, newly selected media, invalid values, preview `getAsset` use, and all seven registrations
- **AND** they confirm the custom admin-media route, resolver, allowlist, and Asset Library suppression are absent.

#### Scenario: Collection image fields are checked

- **WHEN** generated image fields are tested
- **THEN** their media paths remain compatible with the owning Astro `image()` field
- **AND** unsupported preview values produce a bounded fallback rather than a broken editor.

### Requirement: Local and rendered Sveltia validation uses the native repository flow

The system SHALL keep local CMS validation read-only and SHALL use Sveltia's native directory selection instead of a proxy or fake filesystem layer.

#### Scenario: Automated local smoke runs

- **WHEN** `pnpm smoke:cms-local -- --screenshots never` runs
- **THEN** it starts local mode on the fixed loopback CMS port, opens `/admin/index.html`, verifies the pinned runtime accepts the generated configuration and reaches the native repository-selection surface, and checks configured assets and functional console errors
- **AND** a native configuration-error screen fails the smoke even if the runtime loaded and initialization returned
- **AND** content hashes and `git status --porcelain` remain unchanged from the baseline captured after intentional source edits
- **AND** all spawned site and browser processes terminate with the smoke exit status.

#### Scenario: Rendered local walkthrough runs

- **WHEN** the owner selects the repository with Chromium's native picker and Chrome is controlled through the GPT extension
- **THEN** it checks representative Home, Store Item, and Release editing at desktop plus the 320 CSS-pixel floor and confirms the migrated Distro page fields, without selecting Save or Publish
- **AND** collection navigation, field order, validation, image selection, previews, focus, touch targets, and horizontal overflow remain acceptable
- **AND** content hashes and `git status --porcelain` remain unchanged from the post-migration baseline.

### Requirement: UAT Static Smoke verifies hosted Sveltia safety

The system SHALL verify deployed hosted-mode Sveltia without authenticating or publishing content.

#### Scenario: UAT CMS admin smoke runs

- **WHEN** `pnpm smoke:uat-static -- --scenario cms_admin` targets GitHub Pages UAT
- **THEN** it verifies the static admin document, pinned Sveltia runtime, GitHub backend, fixed repository, `main`, authenticator base URL, and absence of Decap, Git Gateway, placeholders, localhost URLs, and leaked secrets
- **AND** it reaches native GitHub sign-in without injected controls or native configuration errors and records failures as UAT Static Smoke evidence.

#### Scenario: UAT CMS asset smoke runs

- **WHEN** `pnpm smoke:uat-static -- --scenario cms_assets` targets GitHub Pages UAT
- **THEN** it verifies representative admin, configuration, preview, and collection-media assets without expecting a custom admin-media route
- **AND** it remains read-only and separate from Provider Smoke or Promotion Evidence.

### Requirement: Sveltia migration passes repository gates

The system MUST validate the exact final Sveltia tree before each hosted cutover.

#### Scenario: Implementation is ready for UAT

- **WHEN** local migration tasks are complete
- **THEN** `pnpm test:cms-admin`, `pnpm smoke:cms-local -- --screenshots never`, `pnpm test:unit`, `pnpm check`, and `pnpm build` pass against the exact final tree
- **AND** the secret-free artifact remains disabled rather than falling back to writable local behavior.

#### Scenario: Hosted Sveltia is accepted

- **WHEN** the implementation commit deploys to UAT
- **THEN** the `cms_admin` and `cms_assets` UAT Static Smoke scenarios pass
- **AND** the owner completes a no-publish walkthrough through the designated GitHub account before PRD cutover.

#### Scenario: PRD cutover completes

- **WHEN** the UAT-accepted implementation's PRD-targeted artifact deploys to PRD
- **THEN** the owner completes a no-publish designated-account check
- **AND** remaining DecapBridge access is removed without retaining a Decap rollback artifact or authentication path.

## REMOVED Requirements

### Requirement: Generated Decap configuration is structurally validated

**Reason**: Decap configuration is removed.
**Migration**: Use `Generated Sveltia configuration is structurally validated`.

### Requirement: Decap collection contracts have focused parity checks

**Reason**: Collection checks now target Sveltia output.
**Migration**: Use `Sveltia collection contracts have focused parity checks`.

### Requirement: Decap media routes and previews are tested together

**Reason**: The custom media route is removed and preview checks now target Sveltia-native asset resolution.
**Migration**: Use `Sveltia previews and media paths are tested together`.

### Requirement: Local CMS Smoke covers representative editor behavior

**Reason**: The Decap proxy smoke cannot represent Sveltia's native local repository flow.
**Migration**: Use `Local and rendered Sveltia validation uses the native repository flow`.

### Requirement: UAT Static Smoke verifies hosted Decap safety

**Reason**: UAT no longer loads Decap or DecapBridge.
**Migration**: Use `UAT Static Smoke verifies hosted Sveltia safety`.

### Requirement: Decap upgrades pass repository gates

**Reason**: The repository no longer upgrades or accepts Decap.
**Migration**: Use `Sveltia migration passes repository gates`.

### Requirement: Rendered Decap usability is validated across desktop and mobile

**Reason**: Rendered acceptance now targets Sveltia's native local repository flow.
**Migration**: Use `Local and rendered Sveltia validation uses the native repository flow`.
