## 1. Inventory And Baseline

- [x] 1.1 Build an image-surface inventory from `apps/web/src/components/**`, `apps/web/src/pages/**`, content collections, public brand assets, cart/checkout runtime images, provider image URLs, admin previews, and email templates.
- [x] 1.2 Classify every image surface as Content Image, Public Brand Asset, Runtime Image Snapshot, or Provider Product Image URL.
- [x] 1.3 Record which static local Content Image surfaces already emit responsive output and which still lack `widths`, responsive layout, or route-appropriate loading behavior.
- [x] 1.4 Run `pnpm assets:check` and record current source warnings before changing media files.
- [x] 1.5 Run a local static build and inspect representative generated HTML for `/`, `/distro/`, `/store/`, `/releases/`, release detail, artist detail, news detail, and `/services/`.

## 2. Astro Responsive Output

- [x] 2.1 Add responsive card width ladders to `DistroCard`, keeping square frames and current visual style.
- [x] 2.2 Add responsive product-card width ladders to `StoreItemCard`.
- [x] 2.3 Add responsive cover-card width ladders to `ReleaseCard`, including framed artwork and artist-discography variants.
- [x] 2.4 Add large/detail width ladders to latest release feature, store detail, release detail, artist detail hero, and news detail lead images.
- [x] 2.5 Add tiny-thumbnail width ladders to artist latest-release and previous-release artwork slots.
- [x] 2.6 Review `InternalPageHero`, About, Services, Home journey, and News card surfaces; keep existing good width ladders and patch only missing responsive output.
- [x] 2.7 Keep raw `<img>` surfaces for cart, checkout, admin preview, email, provider badges, and public brand assets; verify stable dimensions or frame aspect ratios only if touched.

## 3. Priority And Lazy Loading

- [x] 3.1 Add the smallest needed page-to-card `loading` prop path so Distro, Store, Release, Artist, and News grids can mark a leading item set without global runtime logic.
- [x] 3.2 Ensure the leading grid item set uses `loading="eager"` with normal fetch priority while below-fold grid images remain lazy-loaded.
- [x] 3.3 Apply Astro `priority` or equivalent attributes only to the single lead first-viewport media on homepage, release latest feature, store detail, release detail, artist detail, and news detail routes.
- [x] 3.4 Verify no route marks multiple large images with high fetch priority unless measured evidence requires it.
- [x] 3.5 Keep overlay/detail fragment images lazy unless the same route is direct-loaded as first-viewport media.

## 4. Source Asset QA And Repair

- [x] 4.1 Review whether `apps/web/scripts/check-assets.ts` needs changes after the inventory; do not add new source standards unless an actual source problem is not covered by current checks.
- [x] 4.2 If a new asset QA rule is added, add focused tests in `apps/web/test/assets/check-assets.test.ts` and ensure existing provider URL readiness checks stay unchanged.
- [x] 4.3 Decide whether the three existing artist source warnings are fixed, deferred, or documented as intentional content exceptions.
- [x] 4.4 Use ImageMagick only for reviewed mechanical source cleanup such as resizing, stripping metadata, or safe compression.
- [x] 4.5 Use GIMP only for reviewed crop/focal-point repairs where automated source cleanup would damage editorial intent.
- [x] 4.6 Re-run `pnpm assets:check` after any source or QA rule change.

## 5. Loading Treatment

- [x] 5.1 Keep existing aspect-ratio media frames for catalog, hero, detail, and runtime image surfaces.
- [x] 5.2 Add a quiet static placeholder or opacity-only reveal only where Browser Use shows a distracting blank frame after responsive output is fixed.
- [x] 5.3 Ensure any reveal animation is at or below 300ms and disabled or reduced under `prefers-reduced-motion: reduce`.
- [x] 5.4 Confirm no product/card grid uses per-image spinners, shimmer sweeps, or loading copy for normal image streaming.

## 6. Generated Output Checks

- [x] 6.1 Perform a bounded generated-HTML inspection that verifies representative image surfaces emit expected `srcset`, `sizes`, `loading`, `decoding`, and `fetchpriority` attributes; add a permanent script only if manual inspection proves too easy to miss.
- [x] 6.2 Ensure generated-output checks fail when Distro or Store card images lack responsive candidates.
- [x] 6.3 Ensure generated-output checks fail when the intended first-viewport route image is still browser-lazy.
- [x] 6.4 Keep generated-output checks read-only and independent of hosted CDN cache behavior.

## 7. Browser And Performance Validation

- [x] 7.1 Run `pnpm test:unit`, `pnpm check`, and `pnpm build` on the final implementation tree.
- [x] 7.2 Use Browser Use at mobile and desktop widths for `/`, `/distro/`, `/store/`, `/releases/`, one release detail, one artist detail, one news detail, and `/services/`.
- [x] 7.3 For Distro and Store grids, validate first viewport and scrolled viewport behavior: stable frames, no blank dead zones after normal load, eager leading set, lazy below fold, no text overlap, no horizontal scroll.
- [x] 7.4 Validate cart drawer and checkout summary image frames if runtime image markup changes.
- [x] 7.5 Check browser console cleanliness on representative routes.
- [x] 7.6 If hosted behavior is part of acceptance, run the existing UAT/static smoke or PRD hosted cache audit against the relevant Product Environment after deployment.

## 8. Documentation And Closeout

- [x] 8.1 Update image guidance in README, AGENTS, Decap hints, or a narrow docs file only where implementation changes maintainer workflow.
- [x] 8.2 Record final image strategy, source warnings, validation commands, and Browser Use findings in the implementation handoff.
- [x] 8.3 Run `pnpm openspec -- validate optimize-site-image-performance --type change --strict`.
- [x] 8.4 Run `pnpm openspec -- validate --all --strict`.
