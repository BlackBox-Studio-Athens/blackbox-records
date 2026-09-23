## Context

See `proposal.md` for motivation. The canonical Distro manifest currently emits 101 items, including 39 CDs. Distro JSON has one required `image`, required `image_alt`, and required `summary`; Store cards and detail pages consume the same primary image, and Stripe Product Projection independently parses that primary content field. `tools/artwork-fetcher` supplies cover/mockup evidence but explicitly forbids browser automation. The requested Bandcamp/Facebook work is therefore a manual editorial research pass, not a new crawler.

Reconciled 2026-09-17: those counts and repository paths describe the original research snapshot. Gallery and square-CD presentation are implemented. EmDash now owns editorial drafts/media, Items owns catalog publication, and the public renderer reads accepted snapshots. Reconcile the existing ledger against current CMS content IDs before continuing; retain source/rights evidence and unresolved photography blockers. Repository inventory inputs are migration history, not a source for overwriting current CMS edits or stock.

## Goals / Non-Goals

**Goals:**

- Add real physical-CD photography without replacing the existing primary-image contract.
- Review every current Distro summary against official evidence and rewrite only weak copy.
- Keep secondary media owned, accessible, and detail-only through accepted snapshot media.
- Make current-catalog completion measurable without hard-coded item counts or per-item OpenSpec tasks.

**Non-Goals:**

- Changing catalog identity, inventory, pricing, stock, checkout, or Stripe Price authority.
- Adding a scraper, remote-image runtime, Facebook API integration, browser automation to artwork-fetcher, image carousel, lightbox, or dependency.
- Researching non-CD physical photography unless useful official images are found during the copy pass.

## Decisions

### Keep `image` primary and add optional `gallery`

Preserve the implemented optional `gallery` in the shared content-model/EmDash schema, with required alt text and ordered CMS-owned media references. Keep `image` and `image_alt` primary for cards, cart snapshots, metadata and Product presentation. Keep `StorePageEntry` and shared `StoreItem` unchanged. The canonical `/store/[slug]/` detail route uses `sourceId` through `@/lib/content-reader` to load gallery media from the accepted source entry. Do not reintroduce Sveltia, a repository-only media path, another detail route, or a shared gallery abstraction.

Alternative considered: replace `image` with an image array or extend shared Store page/catalog types. Rejected because either spreads detail-only media into card, cart, checkout-return, and provider paths for no user benefit.

### Render a static gallery

Keep the primary image in the current detail hero. When secondary images exist, render them below the main detail block as an ordered responsive grid using Astro image handling. No hydrated carousel or lightbox is needed to view multiple product photos.

### Use one content-id-keyed implementation ledger

Reconcile the existing `research-ledger.tsv` to current CMS Distro IDs; preserve Distro Inventory Source mappings for imported records without requiring new records in that retired source. Keep the existing `content_id`, `group`, `copy_source_type`, `copy_source_url`, `copy_status`, `media_evidence`, `cd_photo_status`, and `notes` columns. Official artist/label Bandcamp, website, Instagram, YouTube or permitted Facebook evidence is acceptable. `media_evidence` maps each accepted file/CMS media identity to source URL and reuse-rights status. Completion requires rights compatible with `ASSETS_LICENSE.md`, including explicit user-provided blanket authorization where applicable. The ledger is evidence, never catalog or stock authority.

Alternative considered: add source URLs to every public content JSON file. Rejected because provenance is implementation evidence, not shopper-facing content, and would duplicate the manifest/content model.

### Research manually through official sources

For each item, use the native Codex browser to inspect official Bandcamp pages first. Continue to an official artist or label website, Instagram, or YouTube presence when Bandcamp is incomplete; skip Facebook when unavailable or excluded by the operator. Verify any saved image depicts the matching edition. Do not use marketplace, resale, review, fan, search-snippet, or unrelated-edition media.

### Review summaries in ledger-driven batches

Process current items by physical group and alphabetically in small batches. Retain concise existing copy when the recorded official source supports it. Rewrite generic, unsupported, inaccurate, or stale copy, including boilerplate such as `Source metadata identifies`, using only supported facts. Do not change content or manifest identity while editing prose.

### Keep completeness validation change-local

Adapt the existing change-local completeness check to current CMS records/media and the ledger. Verify one row per current content ID, no duplicates, completed copy review, actual physical-product photography for every current CD and per-asset source/rights evidence. Preserve historical inventory mappings for imported records; do not add a runtime check or permanent test coupled to this active change path.

### Keep provider projection explicit

Primary-image replacements and summary edits may affect runtime Product presentation; gallery images do not. Save verified editorial edits/media in EmDash, inspect the existing Items publication/readiness path and report any provider effect before applying it. Use bounded `pnpm stripe:catalog:verify --env uat --store-item <slug>` reads when authorized. Do not regenerate retired compiled catalog artifacts, apply repository seeds, change Prices, or reset stock. Keep any UAT/PRD provider mutation within its existing explicit authorization boundary.

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
- [Primary media or summary causes catalog drift] → Review runtime Items readiness/projection effects and keep provider apply outside this change unless explicitly authorized.
- [Retouch changes product evidence] → Reject the edit and use the source-derived deterministic fallback; never invent missing product detail.
- [One group photo is reused for several titles] → Require identifiable title-specific crops and distinct final hashes, or leave the affected title unresolved.

## Migration Plan

1. Retain the completed gallery, copy review and presentation work; adapt the change-local completeness check to current CMS IDs/media and preserve its existing evidence ledger.
2. Research unresolved CDs and retouch pilots in small batches, recording source, rights, native resolution and edition blockers. Recheck copy only for changed/new records.
3. Save accepted media/copy through EmDash and publish selected Distro revisions through Items; verify failed publication retains the prior accepted snapshot and unrelated drafts remain private.
4. Run ledger completeness/placeholder/rights checks and applicable asset checks. For any code changes run `pnpm validate`, `pnpm validate:editor` and the relevant Local preview/publication checks; content-only edits use schema, preview and publication acceptance without a code redeploy.
5. Verify accepted public cards/detail/gallery at desktop and 390 pixels, including no-JavaScript access, alt text, order and stable geometry. Record the content snapshot identity and scoped runtime catalog checks.
6. Content rollback uses a verified accepted snapshot; a compatible code rollback preserves the active content pointer. Neither route rewrites commerce history.
