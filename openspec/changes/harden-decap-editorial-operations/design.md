## Context

BlackBox serves Decap from the static Astro app at `/admin/`. Astro prerenders `/admin/config.yml` from TypeScript builders, deployed builds authenticate through DecapBridge PKCE, and local CMS development uses `decap-server` with the proxy backend. Decap uses `publish_mode: simple`, so editorial publication writes directly to `main` and starts the repository's normal content, artifact, and static deployment workflows.

The focused Decap unit suite and current Local CMS Smoke pass, but they do not cover several real failure seams:

- production-mode config infers the local proxy when DecapBridge endpoints are absent or placeholders;
- the global media folder, collection-local media folders, admin preview route, and mirrored upload library do not share one tested contract;
- the browser runtime is pinned to `decap-cms@3.10.1` while local tooling uses `decap-server@3.7.0`; current package releases at proposal time are `decap-cms@3.14.1` and `decap-server@3.9.1`;
- collection builders duplicate some schema values and expose controls that are stale or ineffective, including homepage `distro` and `journey` section types that the current homepage does not render;
- fixed-layout Home, About, and Services section lists advertise add/remove/reorder behavior even though public rendering resolves known section types into a fixed layout;
- routine content and high-impact site-wide settings share one flat sidebar without a clear operational boundary;
- `public/admin/init.js` contains useful previews and safety repairs, but also relies on generated class-name and DOM-shape selectors that can drift across Decap upgrades.

The primary users are label members editing public content without coding knowledge. Maintainers still own repo configuration and validation. Commerce operators retain Stripe Price Authority, D1/Worker checkout authority, protected stock operations, paid-order state, and fulfillment processes.

## Goals / Non-Goals

**Goals:**

- Make Local, hosted, and disabled Decap build modes explicit and safe.
- Keep DecapBridge authentication and direct publication to `main`.
- Make common editorial work easier to find and harder to misuse.
- Show clear in-product ownership boundaries for non-editorial operations.
- Align collection fields, list controls, validation, previews, and media behavior with the current site.
- Upgrade Decap packages/runtime with compatibility proof and less brittle customization.
- Add focused automated checks that fail before a broken admin reaches UAT or PRD.

**Non-Goals:**

- Editorial Workflow branches, pull-request review, scheduled publishing, or role-based publish approval.
- Replacing Decap or DecapBridge.
- Adding an external media/DAM service.
- Moving price, stock, checkout, order, or fulfillment authority into Decap.
- Redesigning public pages or adding speculative content types.
- An editor handbook, recovery handbook, or manual label-member usability acceptance gate.

## Decisions

### Use one explicit Decap build mode

Introduce one non-secret build setting, `DECAP_BACKEND_MODE`, with three supported values:

- `local`: proxy backend for `pnpm cms:dev`; no hosted authentication.
- `hosted`: DecapBridge PKCE backend; required for UAT and full PRD static deployments.
- `disabled`: branded unavailable admin surface for ordinary secret-free production builds and artifacts that must not expose CMS access, including the PRD Holding Page.

Astro development defaults to `local`. A production/static build defaults to `disabled` unless the workflow explicitly selects `hosted`. Hosted mode validates the required endpoint values and rejects blanks/placeholders before emitting config. It never falls back to `127.0.0.1`.

Alternative considered: keep inferring mode from endpoint presence. Rejected because a missing deployment secret currently changes backend semantics silently and produces a misleading admin.

### Keep direct-to-main publication and make the consequence visible

Retain `publish_mode: simple` and `branch: main`. Collection descriptions and a compact editor notice state that Publish commits immediately to `main` and starts normal site deployment. No draft/review board is introduced.

Alternative considered: `editorial_workflow`. Rejected by user decision; this change optimizes the existing direct-publish model instead.

### Keep the generated TypeScript config, but extend native Decap options

The existing config builders remain because they already centralize escaping, collection construction, and environment-specific config generation. Extend the small builder types only for options used by this change: collection descriptions/singular labels/sort and view controls, preview paths, per-collection preview settings, and list controls such as `allow_add`, `allow_remove`, `allow_reorder`, `min`, `max`, and `label_singular`.

Do not generate Decap fields automatically from Zod. Astro schemas describe stored data; Decap fields also carry editor labels, hints, widgets, validation, and workflow affordances. Share only duplicated closed values and validation primitives that have already drifted, such as distro groups and slug patterns.

Alternative considered: replace builders with a generic schema-to-CMS generator. Rejected as more code, less editor control, and no benefit for the current fixed collection set.

### Organize the sidebar by frequency and risk

Keep existing collection names internally, but order and label the visible surface as follows:

1. Home
2. Artists
3. Releases
4. Store Items — Distro & Merch (`distro`)
5. News
6. About
7. Services
8. Newsletter
9. Store — Distro Page Copy (`distro-page`)
10. Advanced — Navigation
11. Advanced — Social Links
12. Advanced — Site Settings

Advanced collection descriptions warn that changes affect site-wide navigation, metadata, or identity and publish directly to `main`. This is visual separation, not a permission boundary; DecapBridge access remains the authorization boundary.

Alternative considered: separate admin deployments for routine and advanced collections. Rejected because it duplicates config/auth and implies permissions Decap does not enforce here.

### Remove controls that do not map to public behavior

- Home exposes only the current `news` and `artists` section types. Dormant `distro` and `journey` CMS/schema/preview branches are removed after confirming no committed entry uses them.
- Home, About, and Services keep their current stored arrays for a small migration surface, but fixed-layout section lists set `allow_add: false`, `allow_remove: false`, and `allow_reorder: false`. Editors change content inside named sections; they do not create duplicates or reorder controls the public renderer ignores.
- Repeatable content that the public UI genuinely renders in order—paragraphs, credits, links, videos, service items, process steps, and similar lists—retains add/remove/reorder controls with clear singular labels and summaries.
- Artist, Release, and Distro deletion is disabled in Decap because those entries participate in references, stable routes, catalog projection, or operational retirement. News and Social entries remain deletable after their existing confirmation flow; fixed file/navigation entries remain non-deletable.

Alternative considered: make public page rendering follow arbitrary CMS block order. Rejected because the site layout is near-final and the added flexibility would be speculative.

### Improve fields with native widgets and validation

- Replace the build-time Release artist select with a Decap relation widget against the Artists collection so newly published artists become selectable without hand-maintaining option YAML.
- Add Decap-side patterns or native constraints for slugs, URLs, emails, YouTube IDs, dates, integer order fields, and provider URLs where Astro already enforces the same contract.
- Make alt text required for key public imagery after backfilling any legacy omissions.
- Add collection list summaries, singular labels, sort fields, Distro group views, preview paths, and safe examples.
- Keep current English language and terminology; improve clarity without translating or renaming the product domain.

### Keep collection-owned media as source of truth

Image fields continue saving assets beside their content entries so Astro `image()` can validate and optimize them. The global `uploads` directory is not allowed to masquerade as an independent source of truth.

Implementation must inventory the existing mirrored files and choose the smallest safe outcome:

- remove duplicates that are not referenced and keep only genuinely shared assets, or
- hide/limit the top-level Media surface if it cannot offer assets that save back into valid collection-relative paths.

Whichever outcome remains, configured media roots and `/admin/media/<collection>/<asset>` use one allowlist that includes every supported preview source, rejects traversal, returns correct content types, and resolves both existing and newly selected images. Collection image widgets remain the normal upload path.

Alternative considered: move all content images into one global uploads directory. Rejected because it breaks the collection-owned image standard and creates a broad content migration for no public benefit.

### Upgrade Decap with a compatibility gate, not a rewrite

Upgrade to the proposal baseline of `decap-cms@3.14.1` and `decap-server@3.9.1`. Keep the exact-version browser CDN load for this iteration rather than vendoring or bundling the large CMS runtime. Add a visible boot failure state and ensure the UAT Static Smoke fails if the pinned runtime cannot initialize.

Audit every custom DOM patch against the upgraded runtime. Retain a patch only when a focused regression check demonstrates that supported Decap config/API cannot provide the behavior. Preview templates and `CMS.registerPreviewStyle` remain supported customizations. Class-name/DOM mutation patches must fail safely and have a bounded test or smoke assertion.

Alternative considered: self-host or bundle Decap immediately. Rejected because the exact CDN pin plus hosted smoke is the smaller change; self-hosting becomes justified only if availability evidence shows the CDN is an operational problem.

### Keep and realign key previews

Retain current previews for Home, About, Services, Artists, Releases, Distro, and News. Home, Artists, Releases, Distro, and News are the required acceptance subset. Preview content must use current public concepts and media paths; obsolete Home sections are removed. The preview starts collapsed for editor space but exposes a clear accessible Open/Hide Preview control.

Previews are representative editing feedback, not a second implementation of every public component. They should show hierarchy, copy, artwork, metadata, and obvious omissions without reproducing app-shell behavior.

### Put commerce ownership guidance inside the CMS

Add a compact scope panel visible after login and concise warnings in Store Item/Release collections:

- Decap: titles, copy, images, grouping, format, order, and public page content.
- Price: Stripe Dashboard replacement Price under the existing Product, followed by existing verification.
- Stock: protected `/stock/` operations surface.
- Stop-selling/checkout availability: online stock or commerce-operator checkout controls; do not delete editorial content.
- Orders and fulfillment: Worker/Stripe paid-order state and the existing manual fulfillment process, outside Decap.

The panel uses environment-safe product terms and links only to stable surfaces. It exposes no Stripe IDs, D1 IDs, secrets, flag keys, or internal diagnostics.

### Validate behavior at config, route, and browser seams

Tests parse generated YAML rather than relying only on string fragments. They cover explicit backend modes, hosted placeholder rejection, collection ordering/descriptions, field/widget constraints, fixed list controls, relation config, deletion policy, media roots, preview registration, and exact package/runtime pins.

Local CMS Smoke remains read-only and adds representative Home, Artist, Release, Distro, and News editor loads plus preview registration/media checks. UAT Static Smoke verifies hosted mode, no localhost/placeholder output, branded login, pinned runtime boot, and representative admin media assets. Neither smoke publishes content or mutates commerce/provider state.

## Risks / Trade-offs

- **Direct publication can expose mistakes quickly** → Keep explicit Publish-to-`main` notices, stronger field validation, previews, and destructive-action restrictions.
- **A Decap upgrade can invalidate DOM selectors** → Upgrade before polishing, delete unsupported patches where possible, and retain only regression-backed selectors.
- **Hosted mode can break deploys when auth settings are absent** → Make workflow mode explicit, report missing variable names without values, and keep secret-free local builds in `disabled` mode.
- **Global media cleanup can break existing references** → Inventory references first, preserve collection-owned assets, and delete only proven unreferenced mirror files.
- **Disabling deletion reduces editor autonomy** → Prefer stable content identity and operational retirement; maintainers can perform exceptional repository deletions with review.
- **Custom previews can drift from the public site** → Limit them to key visual/content signals and add focused parity assertions when public content structures change.

## Migration Plan

1. Capture current generated config, unit results, Local CMS Smoke, package versions, media inventory, and custom patch inventory.
2. Add `DECAP_BACKEND_MODE`; wire Local to `local`, UAT/full PRD to `hosted`, and secret-free/holding builds to `disabled`.
3. Add hosted validation and disabled admin rendering before changing package versions.
4. Upgrade the pinned browser runtime and local proxy package; rerun targeted tests and Local CMS Smoke.
5. Extend config builders, reorder collections, add descriptions/ownership guidance, and apply field/list/deletion policies collection by collection.
6. Remove dormant Home section types and any now-unused preview/schema branches.
7. Reconcile media roots and mirror files; harden the static media route and preview resolution.
8. Audit and reduce custom DOM patches; realign preview templates.
9. Extend Local and UAT Static Smoke, then run `pnpm test:unit`, `pnpm check`, and `pnpm build` on the final tree.
10. Deploy to UAT first. Roll back by reverting the implementation commit and restoring the previous exact Decap pins; no database or provider rollback is required.

## Open Questions

None requiring user input. Whether an individual DOM repair remains necessary is resolved during the version-upgrade compatibility pass by its focused regression check.
