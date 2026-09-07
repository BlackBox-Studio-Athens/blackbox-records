## Context

See `proposal.md` for motivation. The canonical Distro manifest currently emits 101 items, including 39 CDs. Distro JSON has one required `image`, required `image_alt`, and required `summary`; Store cards and detail pages consume the same primary image, and Stripe Product Projection independently parses that primary content field. `tools/artwork-fetcher` supplies cover/mockup evidence but explicitly forbids browser automation. The requested Bandcamp/Facebook work is therefore a manual editorial research pass, not a new crawler.

## Goals / Non-Goals

**Goals:**

- Add real physical-CD photography without replacing the existing primary-image contract.
- Review every current Distro summary against official evidence and rewrite only weak copy.
- Keep secondary media local, accessible, and detail-only.
- Make current-catalog completion measurable without hard-coded item counts or per-item OpenSpec tasks.

**Non-Goals:**

- Changing catalog identity, inventory, pricing, stock, checkout, or Stripe Price authority.
- Adding a scraper, remote-image runtime, Facebook API integration, browser automation to artwork-fetcher, image carousel, lightbox, or dependency.
- Researching non-CD physical photography unless useful official images are found during the copy pass.

## Decisions

### Keep `image` primary and add optional `gallery`

Extend the Distro schema with `gallery?: Array<{ image, image_alt }>` and mirror it in Sveltia. Keep `image` and `image_alt` unchanged so cards, cart snapshots, metadata, generated Product Projection, and existing content remain compatible. Keep `StorePageEntry` and shared `StoreItem` unchanged. The canonical `/store/[slug]/` detail route uses the Distro `sourceId` to load gallery media from the original content entry and renders it in that route only. Do not add another detail route or extract a shared detail abstraction for this gallery.

Alternative considered: replace `image` with an image array or extend shared Store page/catalog types. Rejected because either spreads detail-only media into card, cart, checkout-return, and provider paths for no user benefit.

### Render a static gallery

Keep the primary image in the current detail hero. When secondary images exist, render them below the main detail block as an ordered responsive grid using Astro image handling. No hydrated carousel or lightbox is needed to view multiple product photos.

### Use one content-id-keyed implementation ledger

Generate `research-ledger.tsv` in this change directory from current Distro content entries and reconcile each row to the Distro Inventory Source. Use `content_id`, `group`, `copy_source_type`, `copy_source_url`, `copy_status`, `media_evidence`, `cd_photo_status`, and `notes`. Copy evidence may use an official artist or label Bandcamp, Instagram, YouTube, Facebook, or website; research prefers Bandcamp, then an official website, Instagram, or YouTube, while Facebook may be skipped when unavailable or excluded by the operator. `media_evidence` maps every accepted local filename to its official source URL and recorded reuse-rights status in the same row. Completion requires license or permission evidence compatible with `ASSETS_LICENSE.md`, including an explicit user-provided blanket authorization when applicable. The ledger records implementation progress and blockers without becoming catalog or inventory authority.

Alternative considered: add source URLs to every public content JSON file. Rejected because provenance is implementation evidence, not shopper-facing content, and would duplicate the manifest/content model.

### Research manually through official sources

For each item, use the Chrome GPT extension to inspect official Bandcamp pages first. Continue to an official artist or label website, Instagram, or YouTube presence when Bandcamp is incomplete; skip Facebook when the operator excludes it. Verify any saved image depicts the matching edition. Do not use marketplace, resale, review, fan, search-snippet, or unrelated-edition media.

### Review summaries in ledger-driven batches

Process current items by physical group and alphabetically in small batches. Retain concise existing copy when the recorded official source supports it. Rewrite generic, unsupported, inaccurate, or stale copy, including boilerplate such as `Source metadata identifies`, using only supported facts. Do not change content or manifest identity while editing prose.

### Keep completeness validation change-local

Run one dynamic completeness check against the current content collection, Distro Inventory Source, and ledger. It verifies one row per current content entry, no duplicates, completed copy review, real physical-product photo status for every current CD, and per-asset source/rights evidence for every added or replaced image. Do not add an application runtime check or a permanent test coupled to an active change path.

### Keep provider projection explicit

Primary-image replacements and summary edits may change generated Stripe Product Projection artifacts, but gallery images do not. Regenerate and check repo artifacts, then report UAT Product Projection drift through the existing dry-run path. Do not apply UAT or PRD provider mutations without separate authorization.

### Retouch verified photography conservatively

Normalize accepted physical-CD primaries to 1440x1440, sRGB, JPEG/WebP quality 88 with metadata stripped and restrained sharpening. Galleries retain natural proportions, with a maximum 1800px longest edge and no enlargement of smaller originals. Preserve filenames and formats where practical. Start from raw baseline `0e0b665d` or a better verified official original. Keep strong real scenes; use matte charcoal only where source-derived product masking is clean. Never use blurred duplicate padding or a rectangular photo pasted over an enlarged copy. Individual closed CDs should occupy roughly 75-85% of the square width with complete edges; open and handmade sets retain all included components.

Use GIMP for masks, crop and modest tonal/perspective corrections, built-in GPT Image only for background cleanup/extension, and ImageMagick for final export. Composite protected original products and overlapping hands over generated backgrounds. Preserve printed details, geometry, edition colors, wear, transparent packaging and reflections. Allow one targeted background retry, then use deterministic processing or record a blocker. A 1440px export is not proof of source detail: inspect the product's native resolution against its largest rendered size and prefer 2x display detail.

CD cards use containment without image zoom. CD detail photos are square, independent of the adjacent text height, with availability in the existing text panel rather than a dark overlay. Responsive sizes cover expanded cards as well as preview cards without a new controller. Galleries reserve intrinsic dimensions instead of forced portrait frames. Derive presentation from existing Distro group data; keep schemas and shared projections unchanged and scope styling to components.

When one official photograph contains multiple products, each title requires a complete identifiable product and sufficient native detail, not merely different bytes. The existing 860x1074 Anima Triste group photo fails this presentation standard and clips the self-titled package. Seek better originals through Bandcamp, official artist/label websites, then Instagram; skip Facebook. Reconcile the self-titled Bandcamp Digipack/CD-r description with earlier jewel-case claims. Leave blocked assets unchanged and prepare an unsent original-photo request. Keep Sun of Nothing's separate front/back views. Store temporary masks and working files outside the repository; commit no duplicate raw archive or XCF file.

Keep source verification separate from visual acceptance. Record per-photo methods, native resolution and acceptance in existing ledger notes and a compact change-local QA report with before/after contact sheets. The 24 previously unresolved CD rows remain outside this retouch batch; newly discovered edition uncertainty is not waived. The retouch pass remains incomplete while any required replacement fails acceptance.

## Risks / Trade-offs

- [Official CD photo does not exist] → Mark the ledger row unresolved and request a user-supplied verified asset; do not pass a mockup as complete.
- [Facebook image belongs to another edition] → Require artist, title, format, and packaging match in the ledger note before use.
- [Official source does not establish reuse rights] → Keep the asset unresolved until compatible license, explicit permission, or user-provided blanket authorization is recorded.
- [Catalog changes during the pass] → Regenerate or reconcile the content-id ledger and run the dynamic completeness check against the final catalog.
- [Gallery increases page weight] → Keep secondary images lazy, responsive, and off the card/provider projection; verify a representative single-image page and each approved gallery cardinality available in the final content on mobile, while fixture tests cover optional multi-image rendering.
- [Primary media or summary causes catalog drift] → Regenerate committed artifacts and keep provider apply outside this change unless explicitly authorized.
- [Retouch changes product evidence] → Reject the edit and use the source-derived deterministic fallback; never invent missing product detail.
- [One group photo is reused for several titles] → Require identifiable title-specific crops and distinct final hashes, or leave the affected title unresolved.

## Migration Plan

1. Add schema, Sveltia, display mapping, static gallery, and focused tests using one representative fixture.
2. Generate the ledger dynamically from current Distro content and reconcile it to the Distro Inventory Source.
3. Research all current CDs in small alphabetical batches, updating media, copy where needed, and the ledger.
4. Review remaining summaries by physical group, retaining supported copy and rewriting only weak copy.
5. Run completeness and placeholder audits, `pnpm assets:check`, regenerate catalog artifacts, and run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
6. Use Browser Use on a representative single-image Distro detail and each approved gallery cardinality available in the final content at desktop and 390 pixels; do not add redundant media to manufacture a visual test case.
7. Roll back per content batch or the gallery infrastructure commit independently if evidence or rendering fails.
