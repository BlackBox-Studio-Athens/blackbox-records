# Tasks

## 1. Reuse the existing content flow

- [x] 1.1 Confirm the installed EmDash APIs and existing preview/review/publication/asset callers, then reuse or extract the small read-only content/media/catalog projection; verify new Release/Distro identities and accepted-media behavior with the existing publication tests.
- [x] 1.2 Feed unsaved editor input and exact saved review selections through that projection over the accepted baseline; verify unrelated drafts are excluded, incomplete input is retained with blockers, and preview does not save or change the publication intent/journal.

## 2. Add the private public-renderer path

- [x] 2.1 Add one private render operation through the existing `PUBLIC_SITE` binding and verify the canonical Local stack reaches it; prove actual public routes/assets render the selection without changing accepted content or entering public caches.
- [x] 2.2 Configure the isolated preview origin and narrowly reuse Access, routing, CSP, and sandbox policy; verify public/alternate entrypoints, unauthorized owners, privileged APIs, arbitrary image/upstream URLs, and write operations are denied.
- [x] 2.3 Add the bounded expiring context map and context-aware page/media transport using existing URL/load seams; verify canonical destinations, real asset ownership, expiry/capacity retry, and no persistent preview/session infrastructure.

## 3. Connect the existing workspace and public behavior

- [x] 3.1 Replace `srcdoc` with the real document and minimal validated frame messages in `ContentPreview`; verify existing debounce, generation ordering, sizes, expand/focus, scroll, readiness, last-good rendering, and hidden-work behavior.
- [x] 3.2 Preserve the same selection through public navigation, overlays, search, redirects, and Back/Forward; verify all collection destinations and Local/hosted bases without adding a router, search index, or freshness probes to cached navigation.
- [x] 3.3 Reuse public shopper-read transport, cart storage, and player behavior inside the preview boundary; verify generated/direct API callers, memory-only cart state, playback across shell navigation, and blocked real checkout/delivery/analytics with no preview data sent to providers.

## 4. Verify representative outcomes

- [x] 4.1 Extend existing render smokes for all thirteen collections and compare paired public/preview screenshots plus content/interaction assertions for Home, Release detail/overlay, and Store listing/detail at mobile/desktop widths in Chromium and Firefox; retain existing required editor width/accessibility checks without a full cross-product matrix.
- [x] 4.2 Add focused regression coverage for context ownership/expiry, forged messages, denied writes, failed assets, and late responses using existing suites; verify usable retry and draft privacy without duplicating native auth/conflict coverage.
- [x] 4.3 Extend one isolated Local publication fixture with a related batch containing media and Store Item identity changes; compare actual public output with preview while inputs remain unchanged, separate preview-only side effects from explicit publication, and restore fixtures.

## 5. Remove duplication and complete the existing gates

- [x] 5.1 Remove the old inert rewrite, page-import dispatcher, duplicated content mapping/cache, and obsolete `appearancePreview` substitutes; update workspace guidance and reconcile the old inactive-preview delta, then verify the canonical Local launcher and one remaining preview path.
- [x] 5.2 Run final-tree `pnpm validate`, `pnpm validate:editor`, canonical CMS/public builds, updated preview/workspace smokes, and relevant Local content/publication checks; verify source fingerprints, no-KV/no-new-session behavior, and review existing diagnostics only if normal preview is slow or fails.

## 6. Roll out when authorized

- [ ] 6.1 Configure the hosted preview origin and run a small authorized UAT smoke under the existing Free-tier procedure, then use the normal reviewed-candidate PRD promotion and compatible rollback process; record actual results and retain catalog/checkout gates. Leave this task unchecked until the separately authorized hosted work is observed.
