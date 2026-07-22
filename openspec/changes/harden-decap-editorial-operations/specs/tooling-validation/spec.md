## ADDED Requirements

### Requirement: Generated Decap configuration is structurally validated

The system MUST parse and validate generated Decap YAML for every supported backend mode instead of relying only on fragment assertions.

#### Scenario: Decap config tests run

- **WHEN** `pnpm test:cms-admin` or the web unit suite runs
- **THEN** tests parse the generated YAML for `local`, `hosted`, and `disabled` behavior
- **AND** they verify backend type, repository, branch, publish mode, auth fields, site/display URL, media settings, collection order, descriptions, and exact runtime version inputs.

#### Scenario: Hosted config contains unsafe fallback data

- **WHEN** a generated hosted config contains `127.0.0.1`, a placeholder site ID, blank required endpoint, or proxy backend
- **THEN** deterministic validation fails
- **AND** failure output names the violated setting without printing secret values.

### Requirement: Decap collection contracts have focused parity checks

The system MUST test the editor structure that can create direct-to-main content.

#### Scenario: Collection builder tests run

- **WHEN** Decap collection tests execute
- **THEN** they verify exact field names, widgets, requiredness, native constraints, relation settings, list controls, summaries, sort/group options, preview paths, and deletion policy for each collection
- **AND** they fail when a stale CMS-only field or option returns.

#### Scenario: Shared closed values change

- **WHEN** distro groups, slug constraints, or another shared closed value changes
- **THEN** tests prove Astro schema acceptance and Decap options remain aligned
- **AND** current committed content still passes `pnpm check`.

#### Scenario: Fixed-layout section controls change

- **WHEN** Home, About, or Services builders change
- **THEN** tests prove add, remove, and reorder controls remain disabled for their fixed section list
- **AND** tests prove genuinely repeatable nested lists retain the intended controls.

### Requirement: Decap media routes and previews are tested together

The system MUST cover media allowlists, route safety, and preview asset resolution with deterministic checks.

#### Scenario: Admin media route tests run

- **WHEN** the admin media route is tested
- **THEN** tests cover every configured media root, supported extension, content type, cache header, missing asset, unknown collection, and traversal attempt
- **AND** the route never reads outside the approved Astro content directories.

#### Scenario: Preview asset resolver tests run

- **WHEN** preview runtime tests exercise existing paths, blobs, data URLs, strings, asset objects, and invalid admin URLs
- **THEN** supported assets resolve to a renderable URL
- **AND** unsupported values produce a bounded fallback rather than a broken editor.

#### Scenario: Global media inventory is checked

- **WHEN** the implementation retains a top-level uploads library
- **THEN** a check reports unreferenced mirrors and assets that cannot be selected into a valid collection-owned field
- **AND** the final accepted inventory contains no known misleading asset entry.

### Requirement: Local CMS Smoke covers representative editor behavior

The system SHALL keep Local CMS Smoke read-only and SHALL extend it beyond singleton field loading.

#### Scenario: Local CMS Smoke runs

- **WHEN** `pnpm smoke:cms-local -- --screenshots never` runs
- **THEN** it starts explicit local mode and loads representative Home, Artist, Release, Distro, and News editors
- **AND** it verifies editor chrome, expected current values, required preview registrations, image resolution, direct-to-main notice, and zero unexpected console/page errors.

#### Scenario: Local CMS Smoke completes

- **WHEN** the Local CMS Smoke exits
- **THEN** it has not selected Publish, written content files, created Git commits, or mutated provider state
- **AND** all spawned Astro/proxy/browser processes terminate cleanly with the smoke exit status.

### Requirement: UAT Static Smoke verifies hosted Decap safety

The system SHALL verify deployed hosted-mode Decap without authenticating or publishing content.

#### Scenario: UAT CMS admin smoke runs

- **WHEN** `pnpm smoke:uat-static -- --scenario cms_admin` targets the GitHub Pages UAT site
- **THEN** it verifies the branded boot/login surface, exact pinned Decap runtime initialization, DecapBridge PKCE config, `main` branch, and absence of placeholders, localhost URLs, password-form copy, and leaked secrets
- **AND** it records failures as UAT Static Smoke evidence.

#### Scenario: UAT CMS asset smoke runs

- **WHEN** `pnpm smoke:uat-static -- --scenario cms_assets` targets the GitHub Pages UAT site
- **THEN** it verifies representative Home, Artist, Release, Distro, News, and retained global-media assets through their supported admin URLs
- **AND** it remains read-only and separate from Provider Smoke or Promotion Evidence.

### Requirement: Decap upgrades pass repository gates

The system MUST validate the exact final Decap tree with focused and repository-wide checks.

#### Scenario: Decap implementation is ready for UAT

- **WHEN** implementation tasks are complete
- **THEN** `pnpm test:cms-admin`, `pnpm smoke:cms-local -- --screenshots never`, `pnpm test:unit`, `pnpm check`, and `pnpm build` pass against the exact final tree
- **AND** the generated secret-free local build presents disabled rather than localhost-backed CMS behavior.

#### Scenario: Hosted Decap is accepted

- **WHEN** the implementation commit deploys to UAT
- **THEN** `cms_admin` and `cms_assets` UAT Static Smoke scenarios pass for that deployed commit
- **AND** no manual editor handbook, recovery handbook, or label-member usability test is required by this change.
