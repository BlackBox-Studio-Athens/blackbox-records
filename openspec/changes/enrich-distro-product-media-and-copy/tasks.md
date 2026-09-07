## 1. Add Optional Distro Galleries

- [x] 1.1 Add failing schema and Sveltia tests for optional ordered `gallery` entries containing one local image and required alt text; verify existing Distro entries remain valid without the field.
- [x] 1.2 Add the optional `gallery` schema and matching Sveltia list field without changing required primary `image`/`image_alt`, inventory, commerce, or provider fields; verify focused schema/CMS tests pass.
- [x] 1.3 Add failing direct detail-route tests proving a Distro item's `sourceId` loads gallery data from its original content entry in canonical `/store/[slug]/` rendering, while shared `StorePageEntry`, `StoreItem`, card, cart, checkout-return, provider, and release-derived projections remain unchanged.
- [x] 1.4 Render secondary images in `/store/[slug]/` as a lazy responsive Astro image grid below the existing Distro detail block without adding a Store overlay or shared detail abstraction; verify zero-, one-, and multi-secondary-image fixtures have correct order, alt text, stable geometry, and no client gallery dependency.

## 2. Establish Research Evidence

- [x] 2.1 Generate `research-ledger.tsv` dynamically from current Distro content entries, keyed by `content_id` and reconciled to the Distro Inventory Source, with `group`, copy evidence/status, per-asset `filename → official source URL → rights status` evidence, CD-photo status, and notes; record current totals as a snapshot rather than hard-coded acceptance criteria.
- [x] 2.2 Run one change-local completeness check over current Distro content, the Distro Inventory Source, and the ledger; verify it detects a missing or duplicate content id, unresolved copy review, unresolved current CD photo, unmatched inventory row, missing per-asset source/rights evidence, or retained generic `Source metadata identifies` boilerplate without adding a runtime check or permanent active-change-path test.

## 3. Research CD Media and Copy

- [ ] 3.1 Using the Chrome GPT extension first and Computer Use only as fallback, research every current CD alphabetically in small ledger-driven batches; verify each completed row has official Bandcamp and/or official band/label Facebook evidence, reviewed copy, a verified physical-CD image, and recorded reuse rights for each accepted asset.
- [ ] 3.2 Add only useful matching-edition secondary views with required alt text when distinct official views exist; verify duplicate crops, unrelated editions, marketplace images, cover-only substitutes, and generated mockups do not satisfy completion.
- [ ] 3.3 Keep any CD without a verified physical-product photo explicitly unresolved and request a user-supplied verified asset; do not claim change completion while such a row remains.

## 4. Research Remaining Distro Copy

- [x] 4.1 Review every current non-CD summary by physical group and alphabetically in small ledger-driven batches using official Bandcamp and/or official band/label Facebook evidence; retain supported copy, rewrite only generic, unsupported, inaccurate, or stale copy, and update each ledger row.

## 5. Verify Content and Projection Boundaries

- [ ] 5.1 Run the final dynamic completeness check; verify one ledger row per current Distro content entry, complete copy review, real physical-product photography for every current CD, per-asset source/rights evidence, manifest reconciliation, no duplicate row, and no unresolved blocker before completion is claimed.
- [x] 5.2 Run the artwork-fetcher unit suite only if its existing normalization or evidence helpers changed; otherwise verify no browser automation or new network source was added under `tools/artwork-fetcher`.
- [ ] 5.3 Regenerate and check catalog artifacts with the existing repo commands, then run read-only `pnpm stripe:catalog:verify --env uat` when UAT access is configured; verify primary image/summary drift is explicit, gallery images are absent from provider projection, and no provider mutation is applied.
- [ ] 5.4 Run `pnpm assets:check`, `pnpm test:unit`, `pnpm check`, and `pnpm build`; verify asset policy, content schemas, generated artifacts, tests, and production build pass on the final tree.
- [x] 5.5 Use Browser Use at desktop and 390 pixels on a representative single-image Distro detail, each approved gallery cardinality available in the final content, and Store cards; verify image quality, order, alt/accessibility structure, lazy loading, no overflow/layout shift, and unchanged primary card/cart presentation without adding duplicate or low-value media to satisfy testing.

## 6. Normalize Verified CD Photography

- [x] 6.1 Extend the change-local ledger validator to hash every referenced image and reject byte-identical photos stored under different filenames; cover the failure in `--self-test` without changing the CLI, TSV columns, or dependencies.
- [x] 6.2 Produce distinct source-derived Anima Triste title crops and split the Sun of Nothing wide photograph into front primary and back gallery assets; update alt text, evidence, and processing notes while preserving official source and rights records.
- [x] 6.3 Normalize all accepted verified-CD primary and gallery photos to 1440x1800, 4:5, sRGB with authentic scenes and protected products unchanged; preserve filenames/formats where practical and keep working files outside the repository.
- [x] 6.4 Generate before/after contact sheets, inspect every final asset at 100%, and verify Store cards and details at desktop and 390 pixels through Browser Use.

## 7. Professional CD Photography (supersedes the section 6 presentation standard)

- [x] 7.1 Implement contained square CD cards/details, remove CD darkening and clipping zoom, correct expanded-card size hints, and render natural-proportion galleries with focused regression checks.
- [ ] 7.2 Research better Anima originals and reconcile packaging evidence; replace only complete, sharp, matched editions. Record blockers and an unsent original-photo request when sources are inadequate.
- [ ] 7.3 Review Anima, The Curf and Full Moon Bonzai pilots before rebuilding other accepted photos from original sources; use square primaries, natural galleries and protected products without blurred duplicate padding.
- [ ] 7.4 Inspect every final asset at 100% and retain before/after contact sheets with per-photo source, processing, resolution and acceptance evidence. Do not mark this complete while required replacements remain blocked.
- [x] 7.5 Run ledger self-test/default validation, asset/unit/check/build gates, regenerate catalog artifacts and read-only UAT verification; report existing and new blockers explicitly. Results and failures are recorded in `photo-qa.md`; this does not mean all gates passed.
- [ ] 7.6 Verify desktop and 390px coverflow, expanded/search catalog, Store cards, detail and gallery rendering, image selection, order, accessibility, overflow and layout stability.
