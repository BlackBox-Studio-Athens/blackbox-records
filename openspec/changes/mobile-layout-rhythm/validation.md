# Planning validation

Revision: 15 October 2026, after the orchestrator's eight decisions. This record supersedes the initial planning fingerprints and task counts.

## Authoring checks

- Task counts: Claude (UI): 10; Codex (non-UI): 0; shared: 6 (16 total). All implementation checkboxes remain unchecked.
- Guard: `pnpm openspec:guard` passed before this revision.
- Strict validation: PASS with `pnpm openspec -- validate mobile-layout-rhythm --type change --strict`.
- Scoped formatting: PASS across the three change folders.
- Planning-artifact SHA-256 fingerprint: `e6b07b1dff15d123be06a10ce121b72a7c50fdb4a6b224156ad60302839be9db` across 10 files, hashing sorted relative-path/file-SHA256 lines joined with LF; validation.md is excluded.
- F1–F22 coverage is retained. C2/C3 still depend on C1.
- Edits are limited to the three named OpenSpec change directories. No direct Git commands, source edits, implementation tests, publication or deployment are part of this pass.
- Preservation check: all 17 protected files retain their pre-revision SHA-256 values.

## Decisions verified in the revised plan

Catalogue order stays as implemented: All places BlackBox releases first by catalog number, then Distro by artist. Existing Distro format links and their Distro counts only move; the no-JavaScript fallback remains reachable. The purchase note stays above the grid. No new order control, facets, counts or data/projection work remains.

Home film chapters retain a 44px phone pause/resume icon; the removal request is recorded as a declined accessibility deviation. The footer target is about 290px at 390px with 44px tap rows, icons beside the logo, inline wrapping links and two-line meta beside Est. 2026. Store format lines are plain ink Inter, Buy keeps its icon, and Only N left shares the Flint edge/surface while Coming Soon/Repressing retain dashed neutral boxes.

No dedicated Codex implementation is identified. Claude owns UI, UI tests and DESIGN.md updates; verification, final pnpm validate and the coordinated UAT push remain shared tasks.

## Acceptance not claimed

This is planning validation, not implementation or browser acceptance. The supplied audit measured Local fixtures; revised geometry, native-link fallback, pause interaction and footer wrapping still require implementation verification. Full `pnpm validate` is deferred to integration because its local formatter can modify unrelated dirty files in the shared checkout. No PRD promotion or Content Publication is implied.

# Implementation validation (Claude, UI)

Recorded 15 October 2026 on `main` at `42f4c2e7` plus the uncommitted C3 tree. Final `pnpm validate`: PASSED, `mode: local`, source fingerprint `384f1788240601fbfd3724bfebdf12e7ed2ffb701a4d883e93a555ad2255dbc1` (37 files, before = after), summary `.codex-artifacts/validation/2026-10-15T18-36-31-997Z-48672-68ad63/summary.json`. Product Environment: Local, Astro dev with `BLACKBOX_PREORDER_PROJECTION=e2e/preorder-projection.json` and stubbed listing reads; no UAT or PRD claim.

## Measured at 390×844 (before → after)

- Home pre-order chapter (photo chapter): 1211 → 887px; media 358×201 inside x=16..374; Pre-order and Listen 171×44 each, 16px apart, under the price.
- Releases featured: lead 1042 → 795px, supporting 1093 → 820px, catalog 660 → 621px; pair 12px under the cover; desktop lead row 547 → 496px with the 464px cover.
- Footer: 417 → about 301px at 390px; the sitemap fills three fixed 44px rows down three columns, so no link sits alone on a row for any count from four up (eight links locally; seven on the production fixture, where Privacy information is gated on approved purchase information). DOM and reading order stay the sitemap order; the visual order runs down each column. Top rule at the gutters.
- Artist count: 106×82 box → 28px inline line. Swipe rows clipped at x=16..374, next News card peeks about 42px; dots 44×44.
- No horizontal overflow at 390 or 1440 on Home, Releases or Artists.

## Checks

- Unit: web-store, web-pages, web-editorial, web-layouts, web-artists, app-shell, ui-foundation, storefront-catalog and commerce-web-integration pass through `pnpm validate`; updated `_releases-page-layout`, `StorePreorderShowcase`, `homepage-hero-css`, `swipe-row-dots`, and added the inline-count test in `_artist-roster-layout`.
- e2e (each spec alone, all projects): release-merchandising 45/46 then the failing Firefox case 2/2 after a test fix (adds the phone summary disclosure case), home-preorders 16/16, home-swipe-rows 8/8, catalog-video-contact 14/14, shell-navigation 49/51 then the footer case 2/2 after a test fix (it covers 390, 320 and 125% text), player-continuity 12/12, routes 65/65, home-hero-film 4/4, public-image-fallback 3/3, availability-alerts 6/6, international-order-item 5/5.
- `pnpm openspec -- validate mobile-layout-rhythm --type change --strict`: valid. `pnpm format:check`: clean.

## Not established

- Film chapter on phones: Local content has no pre-order film, so the retained 44×44 pause/resume icon, Watch and film-tools layout were not rendered; the code path is unchanged and its unit/e2e cases pass.
- 3.3 stress (long content, data saving, refused media) and a visual comparison beyond the 390/1440 screenshots; the eager JavaScript budget (`pnpm performance:bundles`) needs the production build CI runs. The Home showcase gained one wrapper element.
- 3.4 Graphify refresh and the combined F1–F22 review; 3.6 UAT release belongs to the coordinator.

## Release evidence (15 October 2026)

- Commits on `main`: 406bb6e7 (changes), 5b94b7a4 (C1 control family and accent roles), b464302c (C2 store browse plus a 1.3 KiB Store item bundle trim), 72caf965 (C3 phone rhythm plus three CI fixes), 7a8595a5, 45fbe628, 171db02d and c26c1c97 (footer row layout: cascade-independent, column-major with three fixed rows, labels may break at 200% text), 50ab409d and b94498e1/6bddcc08 (UAT smoke: Distro expectation and transient fetch retry), 42f4c2e7 (formatting).
- Release BlackBox run 38795987848 for c26c1c97: check-candidate tests, lint and typecheck, build-uat, all four e2e shards, e2e-webkit and both staff previews green; deploy-uat green on a rerun after the Store Durable Object identity lagged one deploy behind (propagation after back-to-back deploys, not a code change). UAT serves c26c1c97 at https://blackbox-records-web-uat.pages.dev/ behind Cloudflare Access.
- Earlier runs for 5b94b7a4 (Store item eager graph 37 bytes over its 104 KiB budget), b464302c (footer rows, Distro smoke expectation), 72caf965, 50ab409d, 6bddcc08 and 171db02d (footer rows on the seven-link fixture, then horizontal overflow from an unbreakable label) were red for the reasons fixed by the commits above.
- Local evidence: each implementation session ended with a passing `pnpm validate`; the named e2e specs ran one by one against the Local site. Not established here: visual acceptance on UAT by the owner and designer, the film-chapter pause control on phones (no film chapter in Local content), and PRD promotion (out of scope).

## Palette revision (16 October 2026)

Mirrored the approved palette from DESIGN.md and the implementer's gray-notes.md into this change and its two active siblings. Flint replaces the superseded purchase/editorial accent throughout: 800 #4d595c hover/pressed, 700 #626e72 purchase faces and edges, 500 #889396 text and underlines, 300 #c1cbce hover/form-error text, and rgba(98,110,114,.16) surface. The cool gray uses OKLCH hue 215 and chroma 0.012 to 0.016; #f5f5f5 on Flint 700 is 4.82:1, and Flint 500 on #141414 is 5.84:1 and darker than muted #b3b3b3. Sea Green and Slate are unchanged.

The shared accent-colour-roles delta now requires error red only for international restriction notices in the non-Greek buyer flow: item page notice, Store strip, cart drawer and checkout card. Error 700 #bc4945 edges and 500 #e4706a icons/text remain on Charcoal faces; rgba(188,73,69,.16) is defined but unapplied. No control has a red face, and form errors remain Flint 300 beside the visible Error label.

This is documentation-only synchronization. Earlier implementation and release evidence keeps its recorded source scope; no new browser, provider or release acceptance is claimed. Existing implementation task states are preserved.

- Guard: `pnpm openspec:guard` PASS before editing.
- Strict validation: `pnpm openspec -- validate mobile-layout-rhythm --type change --strict` PASS; both sibling changes also pass.
- Palette search: no superseded accent name, token or hex/surface value remains in the three active changes.
- Scoped formatting: `pnpm format:check` PASS on the 18 files listed for this revision.
- Scope: only those 18 OpenSpec files were edited; no direct Git commands, source changes, implementation tests, publication or deployment were performed. Excluded files, archive and product copy were left untouched.
