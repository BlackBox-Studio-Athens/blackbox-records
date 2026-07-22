## 1. Establish the implementation baseline

- [x] 1.1 Run `pnpm openspec:guard` from the main worktree on `main` before implementation starts.
- [x] 1.2 Run `pnpm test:cms-admin` and record any pre-existing failures before changing Decap code.
- [x] 1.3 Run `pnpm smoke:cms-local -- --screenshots never` and record the pre-change Local CMS Smoke result.
- [x] 1.4 Record the installed `decap-server` version, the browser `decap-cms` pin, and every source/test that embeds either version.
- [x] 1.5 Build a collection-by-collection matrix linking each Decap field to its Astro schema, committed content shape, and current public consumer.
- [x] 1.6 Inventory every configured collection media root, the `/admin/media` route allowlist, and every file under `apps/web/src/content/uploads/`.
- [x] 1.7 Inventory each DOM- or class-dependent repair in `apps/web/public/admin/init.js`, including the defect it repairs and its current test coverage.
- [x] 1.8 Inventory missing key-image alt text, dormant Home section values, and CMS fields with no current schema or public consumer.

## 2. Make the Decap backend mode explicit

- [x] 2.1 Add a `local | hosted | disabled` Decap backend mode type in `apps/web/src/lib/admin/decap-runtime-config.ts`.
- [x] 2.2 Parse `DECAP_BACKEND_MODE` as the only mode selector and trim surrounding whitespace.
- [x] 2.3 Default Astro development to `local` and production/static builds to `disabled` when `DECAP_BACKEND_MODE` is absent.
- [x] 2.4 Reject unknown or empty explicit `DECAP_BACKEND_MODE` values with an actionable build error.
- [x] 2.5 Resolve local mode to the proxy backend without requiring DecapBridge endpoints.
- [x] 2.6 Validate `DECAP_LOCAL_PROXY_PORT` as a valid TCP port before emitting local config.
- [x] 2.7 Require the hosted repository, site URL, DecapBridge auth endpoint, and DecapBridge token endpoint before hosted config is generated.
- [x] 2.8 Reject known placeholder values for hosted repository, site, auth, and token settings.
- [x] 2.9 Reject loopback hosts, including `localhost` and `127.0.0.1`, from every hosted backend or site URL.
- [x] 2.10 Validate hosted endpoint URL syntax and require secure HTTPS endpoints outside an explicitly local mode.
- [ ] 2.11 Make `main` the generated Decap branch for both local and hosted modes; remove or reject branch overrides that contradict direct-to-`main` publishing.
- [ ] 2.12 Represent disabled mode without constructing a writable Decap backend configuration.

## 3. Generate safe mode-specific admin configuration

- [ ] 3.1 Update `apps/web/src/pages/admin/config.yml.ts` to resolve the explicit backend mode before building YAML.
- [ ] 3.2 Emit the local proxy backend only when the resolved mode is `local`.
- [ ] 3.3 Emit the DecapBridge PKCE backend only when the resolved mode is `hosted`.
- [ ] 3.4 Ensure hosted YAML contains the canonical repository, `main` branch, `publish_mode: simple`, site URL, display URL, auth endpoint, and token endpoint.
- [ ] 3.5 Ensure disabled mode exposes no usable repository, proxy, auth endpoint, token endpoint, or local backend URL.
- [ ] 3.6 Return an explicit safe response for direct `/admin/config.yml` requests in disabled mode.
- [ ] 3.7 Keep configuration errors limited to setting names and remediation; never include secret values or full environment dumps.
- [ ] 3.8 Add stable mode markers to the admin document or generated response so unit and browser checks do not depend on generated CSS classes.

## 4. Add clear admin boot, failure, and disabled states

- [ ] 4.1 Make `apps/web/src/pages/admin/index.astro` render a branded loading state for local and hosted modes.
- [ ] 4.2 Make disabled mode render a branded “CMS unavailable for this build” surface without loading the Decap runtime.
- [ ] 4.3 Add an explicit error handler for failure to download the pinned Decap browser script.
- [ ] 4.4 Add a bounded initialization timeout for the case where the script downloads but Decap never becomes ready.
- [ ] 4.5 Add a retry action that restarts the browser runtime load without requiring editor knowledge of the console or repository.
- [ ] 4.6 Give loading, disabled, and failed states accessible headings, status semantics, keyboard focus, and readable contrast.
- [ ] 4.7 Keep hosted authentication copy centered on DecapBridge/social sign-in and remove any password-form or GitHub-knowledge implication.
- [ ] 4.8 Add stable `data-*` hooks and focused CSS for browser smoke assertions without coupling tests to Decap-generated classes.

## 5. Wire each environment to the intended mode

- [ ] 5.1 Set `DECAP_BACKEND_MODE=local` inside `apps/web/scripts/start-cms-dev.mjs` before Astro and `decap-server` start.
- [ ] 5.2 Remove any local-development path that claims to use hosted DecapBridge values while the implementation always selects the proxy backend.
- [ ] 5.3 Set `DECAP_BACKEND_MODE=local` explicitly in `scripts/smoke-cms-local.ts`.
- [ ] 5.4 Add a deterministic check proving an ordinary secret-free `pnpm build` produces disabled, not localhost-backed, admin behavior.
- [ ] 5.5 Set the GitHub Pages UAT build in `.github/workflows/pages.yml` to `DECAP_BACKEND_MODE=hosted`.
- [ ] 5.6 Set full PRD CMS builds to `hosted` and secret-free or PRD-holding builds to `disabled` at their existing workflow seams.
- [ ] 5.7 Add a workflow preflight that names missing hosted Decap variable names and stops before building, without printing values.
- [ ] 5.8 Ensure `.github/workflows/uat-static-smoke.yml` receives only the public site target and never requires repository or provider secrets for read-only CMS checks.

## 6. Upgrade and pin the Decap compatibility baseline

- [ ] 6.1 Change `apps/web/package.json` to pin `decap-server` exactly to `3.9.1`.
- [ ] 6.2 Regenerate `pnpm-lock.yaml` and confirm no unintended package upgrades are included.
- [ ] 6.3 Change the browser runtime URL in `apps/web/src/pages/admin/index.astro` to exact `decap-cms@3.14.1`.
- [ ] 6.4 Centralize or expose the browser runtime version so the route and focused tests compare one declared value.
- [ ] 6.5 Search the repository for stale `3.10.1`, `3.7.0`, caret-ranged Decap packages, or unversioned Decap CDN URLs and remove them.
- [ ] 6.6 Run the focused admin unit suite immediately after the version change, before modifying custom DOM behavior.
- [ ] 6.7 Run Local CMS Smoke against the upgraded pair and capture any compatibility regression before further editor changes.

## 7. Extend the YAML builders only where needed

- [ ] 7.1 Extend collection builder types for editor-facing descriptions and `label_singular`.
- [ ] 7.2 Extend collection builder types for explicit deletion policy.
- [ ] 7.3 Extend collection builder types for `sortable_fields` and the supported Decap sort defaults used by this change.
- [ ] 7.4 Extend collection builder types for Distro view groups or filters without introducing a generic query abstraction.
- [ ] 7.5 Extend collection builder types for `preview_path` and per-collection preview settings used by the current admin.
- [ ] 7.6 Extend list field types for `allow_add`, `allow_remove`, `allow_reorder`, `min`, `max`, `label_singular`, and collapsed summaries.
- [ ] 7.7 Extend field types for the native relation widget properties required by Release-to-Artist references.
- [ ] 7.8 Extend field types for native patterns, value ranges, and concise editor hints used by existing Astro constraints.
- [ ] 7.9 Add serializer tests for every new collection and field option, including YAML quoting and boolean handling.
- [ ] 7.10 Add or reuse a YAML parser in focused tests so assertions operate on parsed structures rather than line fragments.

## 8. Reorganize the editor and explain ownership

- [ ] 8.1 Reorder generated collections to Home, Artists, Releases, Distro, News, About, Services, Newsletter, Distro Page, Navigation, Socials, and Settings.
- [ ] 8.2 Apply the visible labels `Store Items — Distro & Merch` and `Store — Distro Page Copy` while retaining the existing internal collection names.
- [ ] 8.3 Add concise collection descriptions for routine editorial collections that identify the public surface each collection changes.
- [ ] 8.4 Prefix Navigation, Social Links, and Site Settings labels with `Advanced —`.
- [ ] 8.5 Add advanced collection descriptions warning that publication changes site-wide navigation, identity, or metadata directly on `main`.
- [ ] 8.6 Add a compact authenticated-editor notice that Publish commits immediately to `main` and starts normal deployment.
- [ ] 8.7 Add an in-CMS scope panel stating which titles, copy, images, grouping, format, order, and public page content belong in Decap.
- [ ] 8.8 Add price guidance that points to replacement Prices under the existing Product in Stripe Dashboard and the existing verification flow.
- [ ] 8.9 Add stock guidance that points to the protected `/stock/` operations surface.
- [ ] 8.10 Add stop-selling guidance that points to online-stock or commerce-operator checkout controls and says not to delete editorial content.
- [ ] 8.11 Add order and fulfillment guidance that identifies Worker/Stripe paid-order state and the existing manual fulfillment process as outside Decap.
- [ ] 8.12 Make the `/stock/` link base-path-safe and avoid links to unstable provider dashboards or internal diagnostics.
- [ ] 8.13 Verify the guidance contains no Stripe IDs, D1 IDs, lookup keys, amounts, secrets, feature-flag keys, BOX NOW credentials, or provider payloads.
- [ ] 8.14 Add focused assertions for collection order, labels, descriptions, direct-publish notice, and commerce ownership copy.

## 9. Align Home, About, and Services with fixed public layouts

- [ ] 9.1 Confirm committed Home content contains only the currently rendered Hero, News, and Artists structures before removing dormant options.
- [ ] 9.2 Remove dormant Home `distro` and `journey` section variants from `apps/web/src/content.config.ts`.
- [ ] 9.3 Remove dormant Home `distro` and `journey` fields from `decap-home-fields.ts` and generated YAML.
- [ ] 9.4 Remove dormant Home `distro` and `journey` preview branches, styles, fixtures, and assertions.
- [ ] 9.5 Disable add, remove, and reorder controls on the fixed Home section list while preserving editing inside each named section.
- [ ] 9.6 Add clear singular labels and collapsed summaries to genuinely repeatable Home child lists.
- [ ] 9.7 Backfill missing Home image alt text, make key Home alt fields required, and add crop/role hints matching the current public layout.
- [ ] 9.8 Disable add, remove, and reorder controls on the fixed About section list.
- [ ] 9.9 Preserve add, remove, reorder, singular labels, and summaries for About paragraphs, links, contact rows, stats, and other rendered repeatable content.
- [ ] 9.10 Backfill required About image alt text and align its preview with the current public hierarchy.
- [ ] 9.11 Disable add, remove, and reorder controls on the fixed Services section list.
- [ ] 9.12 Preserve add, remove, reorder, singular labels, and summaries for service items, process steps, bullets, contacts, and other rendered repeatable content.
- [ ] 9.13 Backfill required Services image alt text and align its preview with the current public hierarchy.
- [ ] 9.14 Add focused tests proving fixed outer lists are locked while supported nested lists remain editable and ordered.

## 10. Improve the Artists collection

- [ ] 10.1 Add an editor-facing Artists description that identifies the roster and artist detail pages it controls.
- [ ] 10.2 Add a singular label, useful list summary, public preview path, and stable sort fields for Artists.
- [ ] 10.3 Disable Decap deletion for Artist entries and explain that structural removal requires maintainer review because routes and Release references depend on them.
- [ ] 10.4 Apply the shared slug constraint and a concise valid-slug example to Artist entries.
- [ ] 10.5 Backfill missing Artist image alt text, require it in Decap and Astro, and retain the current 3:4 crop guidance.
- [ ] 10.6 Align Artist URL, email, YouTube ID, and provider URL fields with the native validation supported by their Astro schema.
- [ ] 10.7 Add singular labels and collapsed summaries to Artist links, videos, members, credits, or other rendered repeatable lists.
- [ ] 10.8 Update Artist preview and focused tests for required imagery, validation, deletion policy, list metadata, sort fields, and preview path.

## 11. Improve the Releases collection

- [ ] 11.1 Add an editor-facing Releases description that distinguishes editorial release content from price, stock, and checkout authority.
- [ ] 11.2 Replace the build-time Artist select options with a native relation widget targeting the Artists collection.
- [ ] 11.3 Configure relation search, display, and stored value fields so the widget saves the canonical Artist entry identity expected by Astro `reference('artists')`.
- [ ] 11.4 Disable Decap deletion for Release entries and explain the stable route, reference, and Store Item consequences.
- [ ] 11.5 Apply shared slug validation plus native date and integer-order constraints to Release fields.
- [ ] 11.6 Align external URL, Bandcamp, Tidal, YouTube, and other provider fields with their current Astro constraints and valid examples.
- [ ] 11.7 Backfill missing Release cover alt text, require it in Decap and Astro, and clarify cover-art expectations.
- [ ] 11.8 Add singular labels and collapsed summaries to Release formats, tracks, credits, links, videos, and other rendered lists.
- [ ] 11.9 Add a public preview path and update the Release preview to show current metadata, artwork, artist relation, and commerce-boundary warning.
- [ ] 11.10 Remove any Release CMS field that lacks a current schema or supported public consumer, then update committed content only when required by that removal.

## 12. Improve the Distro Store Items collection

- [ ] 12.1 Apply the visible label `Store Items — Distro & Merch` while retaining the `distro` collection identity.
- [ ] 12.2 Add a collection description that lists editorial fields and separates price, stock, checkout availability, orders, and fulfillment.
- [ ] 12.3 Disable Decap deletion for Distro entries and direct stop-selling work to the protected operational controls.
- [ ] 12.4 Move Distro group values to one shared source consumed by both Astro validation and Decap options.
- [ ] 12.5 Add a Distro group view or filter using the existing presentation groups, without adding commerce category authority.
- [ ] 12.6 Add useful list summaries, singular labels, public preview paths, and stable title/group/order sort fields.
- [ ] 12.7 Apply shared slug validation and integer-order constraints with concise examples.
- [ ] 12.8 Backfill missing Distro image alt text, require it in Decap and Astro, and clarify product-artwork expectations.
- [ ] 12.9 Align optional links, format, grouping, and other editor fields with current schema constraints while keeping price and stock fields absent.
- [ ] 12.10 Remove any Distro CMS field with no current schema or supported public consumer and add focused parity tests.

## 13. Improve News, secondary pages, and advanced collections

- [ ] 13.1 Add a News description, singular label, current list summary, public preview path, and date-oriented sort fields.
- [ ] 13.2 Keep confirmed News deletion available and verify the delete guard does not accidentally disable it.
- [ ] 13.3 Apply slug/date validation, backfill key News image alt text, and require alt text for new or changed lead imagery.
- [ ] 13.4 Align the News preview with current article metadata, body hierarchy, imagery, and bounded optional-media fallbacks.
- [ ] 13.5 Improve Newsletter labels and hints around visible signup copy without changing its existing behavior or language.
- [ ] 13.6 Align Newsletter URL, email, and other constrained fields with the current schema and mark fixed file content non-deletable.
- [ ] 13.7 Improve Distro Page labels and hints around public Store/Distro copy while keeping the fixed file non-deletable.
- [ ] 13.8 Label Navigation as advanced, add a site-wide risk warning, validate internal paths, and keep its fixed entries non-deletable.
- [ ] 13.9 Label Social Links as advanced, add a site-wide identity warning, validate provider URLs, and retain confirmed deletion for disposable social entries.
- [ ] 13.10 Label Site Settings as advanced, add metadata/identity warnings, and align URL, email, image, and organization fields with current schema constraints.
- [ ] 13.11 Verify all fixed file collections remain singletons and cannot create, duplicate, or delete their canonical file.
- [ ] 13.12 Add focused tests for every secondary and advanced collection label, description, validation, ordering, and deletion policy.

## 14. Reconcile media ownership and the admin media route

- [ ] 14.1 Create one typed allowlist describing every collection-owned media directory supported by Decap previews.
- [ ] 14.2 Include Home, About, Services, Artists, Releases, Distro, and News media roots in that allowlist.
- [ ] 14.3 Include global uploads in the allowlist only if the final inventory proves the retained top-level media surface can save valid paths.
- [ ] 14.4 Make `apps/web/src/pages/admin/media/[collection]/[asset].ts` consume the shared allowlist rather than maintaining a second collection list.
- [ ] 14.5 Normalize and decode route parameters once, then reject separators, dot segments, encoded traversal, and paths outside the allowlisted directory.
- [ ] 14.6 Restrict served files to the image extensions supported by current Astro content and Decap fields.
- [ ] 14.7 Return an explicit correct content type for every supported image extension.
- [ ] 14.8 Replace the current unconditional immutable cache policy with a cache policy suitable for content assets that may be replaced during editing.
- [ ] 14.9 Return bounded 404 responses for unknown collections, unsupported extensions, and missing assets without exposing filesystem paths.
- [ ] 14.10 Compare every mirrored file under `apps/web/src/content/uploads/` with committed collection assets and all repository references.
- [ ] 14.11 Delete only proven unreferenced mirrors; otherwise hide or limit the top-level Media surface so it cannot produce invalid collection paths.
- [ ] 14.12 Align global `media_folder`/`public_folder`, collection `media_folder` values, and the preview route with the accepted media inventory.
- [ ] 14.13 Verify existing collection images and newly selected blob/data assets resolve in every retained key preview.
- [ ] 14.14 Add route tests for every allowlisted root, extension, MIME type, cache header, unknown collection, missing asset, and traversal form.

## 15. Realign previews and reduce brittle admin patches

- [ ] 15.1 Keep preview registration for Home, Artists, Releases, Distro, and News as the required acceptance subset.
- [ ] 15.2 Keep the existing About and Services previews while those public collections remain in scope.
- [ ] 15.3 Remove obsolete Home Distro/Journey preview rendering and represent the current Hero, News, and Artists hierarchy.
- [ ] 15.4 Align Artist, Release, Distro, and News preview labels, metadata, imagery, and optional sections with current public concepts.
- [ ] 15.5 Isolate preview asset resolution so existing paths, blob URLs, data URLs, strings, and Decap asset objects can be tested deterministically.
- [ ] 15.6 Render a bounded visible fallback when optional media or preview data cannot be resolved instead of throwing or producing broken `/admin/` URLs.
- [ ] 15.7 Keep previews initially collapsed to preserve editing width.
- [ ] 15.8 Provide one keyboard-accessible Open/Hide Preview control with accurate label, state, and focus behavior.
- [ ] 15.9 Remove the list-remove-button DOM patch where native fixed-list controls now provide the required protection.
- [ ] 15.10 For each remaining DOM-dependent patch, document the pinned-version defect it repairs and add a focused regression assertion.
- [ ] 15.11 Make retained patches no-op safely when their target is absent and avoid unbounded mutation loops or broad generated-class selectors.
- [ ] 15.12 Update `apps/web/public/admin/preview.css`, `admin.css`, and runtime tests for the final preview and scope-panel behavior.

## 16. Add deterministic configuration and parity tests

- [ ] 16.1 Parse and assert the complete generated local YAML structure in `decap-config.test.ts`.
- [ ] 16.2 Parse and assert the complete generated hosted YAML structure, including DecapBridge PKCE values and `main`/`simple` publication.
- [ ] 16.3 Assert disabled mode produces no usable CMS backend and the admin document does not load Decap.
- [ ] 16.4 Add negative tests for blank hosted values, placeholders, loopback hosts, invalid URLs, invalid ports, invalid modes, and non-`main` branch attempts.
- [ ] 16.5 Assert the exact collection order, visible labels, descriptions, advanced warnings, and direct-publish copy.
- [ ] 16.6 Assert exact field names, widgets, requiredness, patterns, relation settings, summaries, sort fields, view groups, and preview paths per collection.
- [ ] 16.7 Assert shared Distro groups, slug constraints, and other reused closed values remain aligned with Astro schemas.
- [ ] 16.8 Assert Home, About, and Services fixed lists disable add/remove/reorder while supported nested lists retain them.
- [ ] 16.9 Assert Artist, Release, and Distro deletion is disabled; News and Social deletion remains confirmed; singleton files and Navigation remain non-deletable.
- [ ] 16.10 Assert package metadata, lockfile expectations, browser runtime pin, preview registrations, and media allowlist use the accepted exact baseline.

## 17. Harden local CMS process management and smoke coverage

- [ ] 17.1 Refactor the existing managed-process helper only as needed to track Astro, `decap-server`, and browser lifecycle consistently.
- [ ] 17.2 Handle child-process spawn errors with a clear component name and non-zero smoke exit.
- [ ] 17.3 Treat an unexpected early Astro or proxy exit as an immediate smoke failure.
- [ ] 17.4 Terminate every spawned child on success, assertion failure, timeout, Ctrl+C, and parent-process exit.
- [ ] 17.5 Extend Local CMS Smoke to open the canonical Home singleton editor and verify current values and fixed-list controls.
- [ ] 17.6 Extend Local CMS Smoke to open one representative Artist editor.
- [ ] 17.7 Extend Local CMS Smoke to open one representative Release editor and verify the Artist relation control initializes.
- [ ] 17.8 Extend Local CMS Smoke to open one representative Distro editor and verify the group browsing affordance.
- [ ] 17.9 Extend Local CMS Smoke to open one representative News editor.
- [ ] 17.10 Verify the direct-to-`main` notice, editorial scope panel, key preview registrations, and accessible preview toggle during the smoke.
- [ ] 17.11 Verify representative existing images resolve and no unexpected console error, page error, or indefinite boot state occurs.
- [ ] 17.12 Prove the smoke never selects Publish, changes content file hashes, creates Git commits, or leaves Astro/proxy/browser processes running.

## 18. Add read-only UAT Static Smoke coverage

- [ ] 18.1 Extend the `cms_admin` scenario in `scripts/smoke-uat-static.ts` to fetch and parse hosted `/admin/config.yml`.
- [ ] 18.2 Verify the branded boot/login surface initializes through DecapBridge/social sign-in without authenticating.
- [ ] 18.3 Verify the exact pinned `decap-cms@3.14.1` runtime initializes before the scenario succeeds.
- [ ] 18.4 Fail on proxy backend output, localhost, placeholders, non-`main` branch, password-form copy, exposed secrets, or an indefinite loading state.
- [ ] 18.5 Extend the `cms_assets` scenario to request representative Home, Artist, Release, Distro, and News assets through supported admin URLs.
- [ ] 18.6 If a top-level uploads library remains, verify one retained valid asset; otherwise assert the misleading surface is absent or limited.
- [ ] 18.7 Keep both scenarios read-only, unauthenticated, separately evidenced, and outside Provider Smoke or Promotion Evidence.
- [ ] 18.8 Update `.github/workflows/uat-static-smoke.yml` so the new CMS scenarios run for the deployed UAT commit.

## 19. Update maintainer documentation and complete acceptance

- [ ] 19.1 Update repository maintainer documentation with the three `DECAP_BACKEND_MODE` values and their Local, UAT, full PRD, and disabled/holding uses.
- [ ] 19.2 Document that Decap uses DecapBridge/social login, publishes directly to `main`, and must not be configured as an editorial workflow in this iteration.
- [ ] 19.3 Update environment examples with non-secret variable names, safe placeholders, and the hosted preflight contract.
- [ ] 19.4 Remove the contradictory claim that local proxy development can switch to real DecapBridge endpoints without changing mode.
- [ ] 19.5 Keep documentation limited to maintainer setup and in-product ownership copy; do not add an editor handbook, recovery handbook, or manual usability acceptance gate.
- [ ] 19.6 Run `pnpm test:cms-admin` and `pnpm smoke:cms-local -- --screenshots never` against the exact final tree.
- [ ] 19.7 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final tree.
- [ ] 19.8 Inspect the ordinary secret-free build artifact and confirm `/admin/` is disabled and no generated admin asset references localhost or placeholders.
- [ ] 19.9 Run `pnpm openspec -- validate harden-decap-editorial-operations --type change --strict` after implementation notes and task state are updated.
- [ ] 19.10 Deploy the implementation commit to UAT, run `cms_admin` and `cms_assets`, and record the passing UAT Static Smoke evidence for that exact commit.
