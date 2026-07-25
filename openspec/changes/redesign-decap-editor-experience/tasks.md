## 1. Upgrade, Authentication, and Boot Lifecycle

- [x] 1.1 Pin `decap-cms@3.15.1` and `decap-server@3.10.0` in package metadata and lockfile, then update the browser runtime URL and exact-version assertions.
- [x] 1.2 Update Decap compatibility documentation and remove references that make 3.14.1 or 3.9.1 the supported baseline.
- [x] 1.3 Add a stable app-owned `#nc-root` beside the separate boot root and enforce `.blackbox-cms-boot[hidden] { display: none; }` as the defensive layout invariant.
- [x] 1.4 Replace the current `CMS.init()` return-value readiness assumption with one bounded child-list observer scoped to `#nc-root`; mark ready only after the first rendered child and disconnect on success, failure, timeout, retry, or disposal.
- [x] 1.5 Add focused lifecycle tests for no-premature-ready behavior, mount-already-rendered behavior, timeout, retry, stale attempts, focus/live-region state, and observer/timer cleanup.
- [x] 1.6 Change BlackBox-owned hosted sign-in guidance to require the shared label Google account without claiming hosted DecapBridge hides Microsoft or password methods; update documentation and assertions that currently require provider absence.

## 2. Fixed Page Content Migration

- [x] 2.1 Replace Home's fixed section array with named `hero`, `news`, and `artists` objects in committed content, Astro schema, Decap fields, queries, rendering, preview, and tests.
- [x] 2.2 Replace About's fixed section array with named `hero`, `lead`, `story`, `quote`, `contact`, and `stats` objects in committed content, Astro schema, Decap fields, queries, rendering, preview, and tests.
- [x] 2.3 Replace Services' fixed section array with named `hero`, `services`, `process`, and `inquiry` objects in committed content, Astro schema, Decap fields, queries, rendering, preview, and tests.
- [x] 2.4 Remove the old fixed-section arrays, type discriminators, structural-control repair code, and compatibility assumptions after all three pages build from the named objects.
- [x] 2.5 Add parity tests proving fixed page structures cannot expose add/remove/duplicate/reorder controls while nested repeatable lists retain their native controls.

## 3. Native Decap Configuration and Navigation

- [x] 3.1 Extend the existing YAML/config builders only as needed for per-file descriptions, native view filters, single-image options, current branding, valid paired list limits, and useful collapsed summaries; add focused builder tests.
- [x] 3.2 Replace `logo_url`, deprecated Markdown widget declarations, and ineffective one-sided list limits with supported Decap options; gate the rich-text migration by round-tripping every committed Artist and News Markdown body through Astro acceptance.
- [x] 3.3 Reorder top-level collections to Store Items, Releases, Artists, News, Site Pages, Advanced Navigation, Advanced Social Links, and Advanced Site Settings.
- [x] 3.4 Consolidate Home, About, Services, Newsletter, and Store — Distro Page Copy into collection `site-pages` in that order, retain file IDs `home-site`, `about-site`, `services-site`, `newsletter-site`, and `distro-page-site`, and keep their stored file locations unchanged.
- [x] 3.5 Update canonical routes, file-specific preview registrations, singleton expectations, route guards, smoke fixtures, and tests to `#/collections/site-pages/entries/<file-id>`; remove active assumptions about the old separate page collections.
- [x] 3.6 Give every Site Pages file entry one concise label and description, and update collection descriptions, add labels, hints, and direct-to-`main` warnings for concise non-technical language while preserving current domain terms.

## 4. Store Item, Release, and Image Workflows

- [x] 4.1 Reorder Store Item fields around identity, group, image, alt text, and summary; keep presentation metadata later and keep all commerce-authority fields absent.
- [x] 4.2 Add native Store Item summaries, sort fields, group views, and filters for the current catalog groups, with focused config tests for the roughly ninety-entry collection.
- [x] 4.3 Reorder Release fields around title, Artist relation, cover image, alt text, release date, formats, and public copy; retain canonical Astro reference storage.
- [x] 4.4 Configure collection-owned single-image fields to disable arbitrary URL entry and multiple selection while preserving upload, browse, replace, validation, and preview behavior.
- [x] 4.5 Audit configured required alt-text fields and current content; backfill only actual missing or blank values, and leave an already complete content inventory unchanged.
- [x] 4.6 Keep the top-level Media surface absent unless tests prove every visible asset can be selected into a valid collection-owned field without breaking collection image widgets.
- [x] 4.7 Replace the editor-visible Artist Slug field with non-required hidden Decap storage while keeping the saved Astro field required, use Decap's native `{{slug}}` filename template, and register one `artists`-only `preSave` generator before initialization through the existing shared slug helper; generate only when blank and never regenerate a nonblank slug after title edits.
- [x] 4.8 Preserve every committed Artist slug, filename, public route, and Release reference; keep explicit overrides source-only and add round-trip, format, and collision coverage for those identities.

## 5. Repair Disposition and Mobile Usability

- [x] 5.1 Apply every disposition in the design repair table before deleting the body-wide observer and aggregate 3.14.1 repair registry; do not silently remove required behavior.
- [x] 5.2 Delete the editor scope panel, fixed-layout section-action repair, timed preview auto-collapse, generated-class selectors, and superseded repairs after their native copy or named-object replacements are active.
- [x] 5.3 Retain the empty-singleton guard as a named no-native exception, move it to canonical `site-pages` and Site Settings routes, and scope its bounded observer to the CMS mount for only the active matching route.
- [x] 5.4 Characterize the native 3.15.1 login action, preview toggle, and saved singleton navigation in the implementation slice; delete each old repair when acceptance passes, otherwise retain only the design-approved bounded semantic adjustment with its focused regression test.
- [x] 5.5 Retain top-level Media suppression as a named stable-route exception unless 3.15.1 provides a native omission, and verify collection-owned image controls still support upload, browse, replace, validation, and preview.
- [x] 5.6 Add focused runtime tests for every repair-table row, including required replacement behavior, safe no-op handling, bounded cleanup, and absence of document-wide session observers or timed synthetic editor actions.
- [x] 5.7 Replace blanket input box-model and link/button foreground rules with semantic scopes; keep real text controls styled while resetting internal `role="combobox"` inputs so every select and relation widget retains correct native geometry.
- [x] 5.8 Ensure primary workflow actions and standalone icon controls are at least 44 by 44 CSS pixels with accessible names and visible focus; require WCAG 2.2 AA contrast for actionable default, hover, focus, and active states, keep disabled states legible and distinct, and verify Artist, Store Item, image, Release, navigation, validation, and preview tasks need neither hover nor desktop width.
- [x] 5.9 Use the existing horizontal BlackBox wordmark as a dark mark on the light authenticated header, keep Contents text-only by hiding its native document SVG through the stable `a[href="#/"]` route selector, and add no generated-class or observer dependency.
- [x] 5.10 Bind the standalone `cms:dev` Astro process to `127.0.0.1` so the page origin matches generated local site, display, logo, proxy, and smoke URLs without changing hosted behavior.

## 6. Deterministic and Rendered Validation

- [x] 6.1 Update generated-config and collection-contract tests for exact versions, shared-Google guidance without provider-exclusivity claims, canonical `site-pages` identity/routes, file order/descriptions, named page objects, field order, widgets, summaries, sorts, groups, filters, image options, list limits, and deprecated-option absence.
- [x] 6.2 Update boot and admin-runtime tests for truthful `#nc-root` readiness, the complete repair-disposition table, retained-exception cleanup, preview accessibility, singleton protection, and Media suppression.
- [x] 6.3 Update media-route and preview-resolver tests for collection-owned image selection, new fixed-page shapes, safe fallbacks, supported extensions, and global Media suppression.
- [x] 6.4 Add focused tests for Artist slug generation and preservation, absence of an editor-visible slug field, native filename configuration, composite-control CSS boundaries, action contrast selectors, header wordmark/icon behavior, and standalone local host consistency.
- [ ] 6.5 Extend Local CMS Smoke to use semantic role/name queries, verify automatic boot dismissal, same-origin branding assets, canonical Site Pages routes, the new Artist form without a Slug control, correct Group selector geometry, readable actions, new Store Item and Release forms, and existing image selection without Save or Publish; exercise desktop/mobile states and fail when before/after content hashes or `git status --porcelain` differ.
- [ ] 6.6 Extend UAT Static Smoke to verify truthful loading-to-DecapBridge transition, shared-Google guidance on the BlackBox-owned surface, exact runtime/config and wordmark asset safety, representative collection media, and absence of placeholders, localhost URLs, repository credential prompts, or leaked secrets without asserting hosted provider alternatives are absent.
- [x] 6.7 Run focused Artist slug, admin style, branding, and local-origin tests plus Local CMS Smoke, then run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact final tree.
- [x] 6.8 Use Browser Use to complete the local desktop walkthrough, 390-pixel mobile walkthrough, and 320-pixel overflow inspection; verify the Artist form has no Slug control, header wordmark and text-only Contents route are legible, composite selectors are aligned, actions meet contrast and 44-pixel target requirements, focus is visible, no required action is clipped, and Store Item, image, Release, and preview workflows work without publishing.
- [ ] 6.9 Deploy the exact accepted commit to UAT, pass `cms_admin` and `cms_assets`, and complete the owner's shared-Google, no-publish walkthrough of Artist creation, Store Item creation, Store Item image work, and Release creation before closing the change.
