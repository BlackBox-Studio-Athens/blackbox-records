## Context

See `proposal.md` for motivation. The public site is a static Astro application whose CMS edits Markdown, JSON, and collection-owned images in the same GitHub repository. At migration start the admin entrypoint was an Astro page; `/admin/config.yml` is generated from TypeScript builders, and custom JavaScript supplies seven previews plus Artist slug generation. Partial implementation progress is recorded in `tasks.md`.

The original provider boundary includes a Decap browser runtime, Google login through DecapBridge and Git Gateway, a local `decap-server` proxy, build variables, a custom media route, and DOM repair code. Browser Use on September 3, 2026 reached the pinned Sveltia runtime but found two native configuration errors: three Distro page field names contain spaces, and global `public_folder: ./` is invalid. A small source migration and valid native media configuration replace the original assumption of unchanged schemas.

Sveltia does not support Git Gateway. Hosted editing therefore uses its GitHub backend and the official OAuth authenticator. Local editing uses the browser's File System Access API and needs neither OAuth nor a proxy. Sveltia is beta, so the runtime remains exactly pinned.

## Goals / Non-Goals

**Goals:**

- Keep `/admin/`, content file locations and meaning, collection identities, public routes, collection-owned media locations, preview outcomes, and direct-to-`main` behavior.
- Replace Decap runtime, authentication, proxy, and environment wiring with the smallest supported Sveltia integration.
- Use GitHub OAuth through one designated GitHub account without personal access token instructions or CMS user management.
- Remove Decap-only workarounds, including the custom boot state machine and admin media route.
- Preserve disabled builds and read-only local/UAT validation.

**Non-Goals:**

- No editorial, public-route, database, commerce, stock, checkout, or operator-auth redesign. Internal content keys and schemas may change when native compatibility requires it and existing meaning and public identities are preserved. The user approved replacing obsolete pre-launch catalog image URLs without redirects.
- No Editorial Workflow, pull-request workflow, roles layer, per-editor account model, or automatic local Git commit/push flow.
- No Google CMS login, Git Gateway, custom or forked authenticator, repository-write proxy, CMS backend service, or commerce Worker reuse.
- No Decap/Sveltia dual-running artifact, runtime feature flag, or Decap rollback path.
- No rename-only sweep of compatible collection-builder files. Rename a file only when its provider-specific behavior changes or the old name would misdescribe the retained entrypoint.

## Decisions

Prefer native Sveltia behavior, existing helpers, and direct source edits. Small compatibility changes to schemas, configuration, and internal file organization are in scope when they remove workarounds and preserve the required outcomes. Do not add a compatibility layer, migration framework, schema versioning, dual writes, or permissive replacement controls to retain an incompatible internal shape. New public behavior or security changes still need a separate decision.

### 1. Use Sveltia's static Astro admin entrypoint

Replace `apps/web/src/pages/admin/index.astro` with `apps/web/public/admin/index.html`. Keep the prerendered `apps/web/src/pages/admin/config.yml.ts` route and static preview assets. Use same-directory relative URLs so the document works under the UAT base path and the PRD root.

Why: Sveltia's native local workflow requires a static Astro admin document so content saves do not trigger Astro page reloads. A second admin route or provider switch would add another writable surface.

### 2. Pin the CDN runtime and keep bootstrap logic small

Pin the browser script to `@sveltia/cms@0.205.2`, verified on September 3, 2026. Continue the CDN model rather than adding an npm runtime dependency.

The static document loads one small app-owned bootstrap:

1. Fetch `./config.yml` and read `# blackbox-sveltia-mode: local|hosted|disabled`.
2. For disabled mode, show the branded unavailable state without loading Sveltia.
3. For local or hosted mode, set `window.CMS_MANUAL_INIT = true`, load the pinned runtime, register preview styles, preview templates, and the Artist `preSave` hook, then call `CMS.init()`.
4. If the configuration or runtime cannot load, replace the loading copy with one concise reload instruction.

Delete the Decap boot state machine, bounded timeout, retry controller, singleton guard, global observers, generated-class selectors, and timed actions.

Why: manual initialization is required for the retained extension APIs; the rest is provider-specific defensive code.

### 3. Generate one Sveltia-compatible configuration

Retain the TypeScript YAML builder and current collection definitions. Emit:

```yaml
backend:
  name: github
  repo: BlackBox-Studio-Athens/blackbox-records
  branch: main
  base_url: <hosted authenticator URL>
publish_mode: simple
output:
  omit_empty_optional_fields: true
media_libraries:
  default:
    config:
      slugify_filename: true
```

`base_url` is hosted-only. Local mode uses the same fixed repository and branch without authentication. Disabled mode emits only its mode marker and unavailable comment.

Use only:

- `SVELTIA_BACKEND_MODE=local|hosted|disabled`
- `SVELTIA_AUTH_BASE_URL` in hosted mode

Development defaults to local mode; production without an explicit mode defaults to disabled. Derive site, display, logo, and base-path URLs from the existing Astro site/base configuration. Keep the local CMS host and port fixed in `cms:dev`; do not add a port variable.

Replace image-field `allow_multiple` with Sveltia's `multiple`, remove ignored `options_length`, and remove any other unsupported Decap option found in the generated configuration. Keep supported collection behavior unchanged.

Remove all `DECAP_*`, `DECAPBRIDGE_*`, proxy variables, and the separate hosted preflight. Configuration generation provides the missing-setting failure; the existing post-build mode check validates the artifact.

### 4. Migrate three Distro page copy keys in place

Only these persisted keys under `apps/web/src/content/distro-page/site.json` → `group_intros` change:

| Old name        | Proposed name   | Location       | Kind     | Reason                  | Risk                | Changed   |
| --------------- | --------------- | -------------- | -------- | ----------------------- | ------------------- | --------- |
| `Vinyl 12-inch` | `vinyl_12_inch` | `group_intros` | JSON key | Native-valid snake_case | Coordinated cutover | Plan only |
| `Vinyl 10-inch` | `vinyl_10_inch` | `group_intros` | JSON key | Native-valid snake_case | Coordinated cutover | Plan only |
| `Vinyl 7-inch`  | `vinyl_7_inch`  | `group_intros` | JSON key | Native-valid snake_case | Coordinated cutover | Plan only |

Keep the visible field labels, all intro text, and the `CDs`, `Clothes`, `Tapes`, and `Other` keys unchanged. Distro item `group` values and `DISTRO_GROUP_VALUES` remain unchanged; these are catalog classifications, not the renamed copy keys. Preserve the combined 7-inch/10-inch shelf's use of the 7-inch intro.

Update the JSON, Astro schema, CMS fields, and existing grouping/rendering consumers together. Keep the key-to-label correspondence as plain data in the existing Distro module, shared where needed; do not put translation or fallback logic in the page renderer. Update focused collection, grouping, and rendered-copy checks, and regenerate Astro schemas through the normal tooling rather than hand-editing generated files.

The cutover accepts and writes the new keys only. Pause editorial saves during deployment and reload the admin afterward so stale sessions cannot write the old shape. Ship data and consumers in the same commit; no alias period or migration runner is needed for one repository-owned JSON file. Recover any incorrectly moved text from Git history into the new keys and fix forward.

Why: direct key migration preserves fixed fields and their meaning. A KeyValue editor would weaken the fixed-key contract; an adapter would keep two representations alive.

### 5. Use one official GitHub OAuth service and one designated account

Deploy the official `sveltia/sveltia-cms-auth` Cloudflare Worker outside this repository. Register one GitHub OAuth app with callback `<worker-url>/callback`. Configure encrypted `GITHUB_CLIENT_SECRET`, `GITHUB_CLIENT_ID`, and exact UAT/PRD `ALLOWED_DOMAINS`. Hosted builds receive only the non-secret Worker URL.

One designated GitHub CMS account has write access to `BlackBox-Studio-Athens/blackbox-records` and signs in through GitHub OAuth. Editors share that operational identity outside this repository. Commits therefore use that account's attribution. Keep Sveltia's native sign-in screen intact; designated-account instructions belong in operator guidance, not injected login controls. Sveltia adds no roles or user directory.

Rejected alternatives:

- Personal access token instructions.
- Google/DecapBridge login through Git Gateway, which Sveltia does not support.
- Individual-account provisioning, which is not required for the chosen operating model.
- Custom authentication or repository-write proxy.

### 6. Use native media and preview APIs

Use the existing shared public assets directory for global storage: `media_folder: /apps/web/public/assets`, with `public_folder` derived from Astro's base (`/blackbox-records/assets` for Local/UAT, `/assets` for PRD). This is a real served path, not `./` or a new admin-media endpoint.

Keep the collection/file overrides for images beside their entries, including their relative stored paths. The global correction does not move existing assets or redirect collection uploads into shared storage. Keep Sveltia's native Asset Library visible; do not patch or suppress it.

Adapt the seven preview templates only as needed for Sveltia's supported preview props. Resolve preview media through the supplied `getAsset` function. Delete the custom `/admin/media/**` route, preview resolver, allowlist, and route-specific tests.

For public catalog consumers, emit Distro and Release image files at `/assets/catalog/<collection>/<filename>` using one static Astro endpoint owned by `storefront-catalog`. Enumerate source files at build time and pass trusted file paths as endpoint props. Update Store image overrides, the catalog URL generator, generated projections, and fixtures together. Preserve source images and commerce authority; add no legacy URL route, redirect, CMS resolver, or live provider mutation.

Keep the Artist `preSave` transformation on the shared repository slug library. Do not add a CMS compatibility adapter.

### 7. Keep generic commands and remove obsolete processes

Keep `cms:dev`, `test:cms-admin`, `smoke:cms-local`, and the UAT `cms_admin`/`cms_assets` scenarios.

`cms:dev` starts only Astro at `127.0.0.1:4322` and fails clearly if that port is occupied. Reuse the existing smoke process lifecycle and evidence helpers. Remove `cms:proxy`, `cms:hosted:preflight`, `start-decap-proxy.mjs`, `decap-server`, proxy executable discovery, and proxy process supervision.

### 8. Validate contracts once

Automated checks cover:

- local, hosted, and disabled configuration;
- known Sveltia option compatibility, including native-valid field names and absolute global public media paths;
- collection/schema parity after the three-key migration, unchanged shelf labels/text/group membership, Artist slug behavior, Markdown round trips, media paths, and seven preview registrations;
- exact runtime pin and absence of Decap, Git Gateway, proxy, custom admin-media, and unsupported configuration;
- local startup reaching the native repository-selection surface without changing content;
- UAT runtime, configuration, and static assets without authentication or publication;
- deployment triggering when admin-library files change.

First prove the generated configuration reaches the native repository-selection surface in the pinned runtime. A configuration-error screen fails acceptance even if the script loaded and `CMS.init()` returned. Use the existing smoke for this check; do not recreate Sveltia's full validator in application code.

The owner completes Chromium's native directory picker, then Chrome with the GPT extension performs one representative desktop walkthrough and one 320 CSS-pixel check, including the migrated Distro page fields. No-save checks compare against the working tree after the intentional source migration, not against its pre-migration contents. Do not fake the File System Access API or automate GitHub credentials. The owner performs the authenticated no-publish UAT walkthrough.

## Risks / Trade-offs

- **Sveltia is beta** → Keep `0.205.2` pinned; update it only through a separate reviewed change.
- **Saved output differs from Decap** → Enable empty-field omission and filename slugification, then retain focused Astro round-trip checks.
- **New copy keys are incompatible with old readers or editor sessions** → Change data, schema, fields, and consumers together; pause saves during cutover, reload afterward, and prove unchanged rendered copy.
- **The shared GitHub account hides individual attribution** → Accept this for the current small editorial team; move to individual GitHub accounts only when accountability requires it.
- **The local workflow requires Chromium** → Document Chromium as the supported local CMS browser.
- **Simple direct publishing allows edit conflicts** → Keep the existing small-team rule: do not edit the same entry concurrently.
- **The authenticator is external** → Restrict it to exact UAT/PRD domains and keep its credentials in Worker secrets.
- **There is no Decap rollback** → Block PRD on UAT defects and fix forward.

## Migration Plan

1. Complete the three-key source migration and native media/configuration corrections, then prove the pinned runtime accepts the generated config before expanding the cutover work.
2. Finish the admin, previews, slug hook, local launcher, tests, and Decap removal; keep module-boundary spec/manifest declarations synchronized with the new entrypoints. Pass focused local checks and the desktop/320px Browser Use walkthrough.
3. Deploy the official authenticator, configure GitHub OAuth and exact allowed domains, and grant the designated GitHub account repository write access.
4. Update static workflows and UAT smoke, including removal of the admin-library path ignore, then stage UAT using the existing workflow: pause editorial saves and unrelated main pushes, put `[skip ci]` on cutover commits, and manually dispatch `target=uat` with the exact `artifact_commit_sha`. Manual runs retain full checks; later automatic deployments stay unchanged.
5. Run unauthenticated UAT smoke and the owner's GitHub-authenticated no-publish walkthrough.
6. Manually dispatch `target=prd` with the UAT-accepted `artifact_commit_sha`; build and deploy the accepted implementation for PRD's own Astro site/base target, complete the no-publish check, and remove the remaining external DecapBridge setup. Do not reuse the UAT base-path artifact at the PRD root. Fix forward; do not retain a Decap artifact or auth path.
