## Context

BlackBox Records is a static Astro 6 site with repo-owned content collections and a persistent app shell. Images are central content: album covers, distro product shots, artist portraits, services photography, news lead images, brand marks, provider images, cart snapshots, and email product context.

Current baseline:

- `site-images` already defines four image roles: Content Image, Public Brand Asset, Runtime Image Snapshot, and Provider Product Image URL.
- Astro content collections already use `image()` for local content images.
- Many Astro components use `<Image>`, but not all define `widths`; without `widths` or responsive layout, several card/detail surfaces emit one large transformed image instead of a `srcset`.
- The live distro page showed visible first-row product images using `loading="lazy"` and no `srcset`, with source output around 3544px for cards rendered around 345px.
- `HomeHero` and some card types already use `priority` or `widths`, so the fix is not a universal rewrite.
- `pnpm assets:check` is already Sharp-backed, read-only, and currently passes with warnings for three artist images that miss the documented 3:4 portrait source standard.
- ImageMagick 7.1.2 and GIMP 3.0.4 are available locally. Sharp is already installed in `@blackbox/web`.

Research basis:

- Astro docs: `<Image>` can generate responsive `srcset` with `widths` plus `sizes`; `priority` sets eager loading, sync decoding, and high fetch priority for above-the-fold images; public-folder images are not optimized by Astro.
- Web performance convention: page HTML should render progressively, above-the-fold/LCP images should not be lazy-loaded, offscreen images should stay lazy, and layout space should be reserved to protect CLS.
- UI convention for this product: record/store grids should feel immediate and stable, not blocked by full media completion. Quiet placeholders beat per-card spinners.

## Goals / Non-Goals

**Goals:**

- Make every static local Content Image emit appropriately sized responsive output when Astro can optimize it.
- Treat above-the-fold media by section, not with one global rule.
- Keep the page rendering progressively; do not wait for all images.
- Keep card grids visually stable with reserved aspect-ratio frames.
- Use ImageMagick/GIMP only for source asset repair, not as a parallel build pipeline.
- Use existing read-only QA; extend it only if the inventory finds a real source problem it does not cover.
- Validate visually with Browser Use on representative local and hosted static routes.

**Non-Goals:**

- No new CDN, DAM, image SaaS, R2 media bucket, SSR image service, service worker, or Pages Functions.
- No automatic bulk image rewriting on every build.
- No universal image wrapper unless repeated local patterns prove it removes real duplication.
- No editorial crop changes without reviewing the affected image.
- No cart/checkout/provider authority changes; Runtime Image Snapshots stay display-only.
- No AVIF/Picture rollout until responsive WebP output is measured and still insufficient.

## Decisions

### Decision 1: Progressive Rendering Stays

Do not block route rendering until all images finish. Astro should render the document and stable media frames immediately, then let browser image loading fill the frames.

Why: Blocking on 20-30 catalog images makes the page feel slower, especially on mobile. For this site, users can scan titles and card structure while images load.

Alternative rejected: render the whole page only after image completion. That improves one visual moment but worsens first paint, input readiness, and perceived speed.

### Decision 2: Use Astro Responsive Output Before Source Rewrites

Primary implementation is to add or tune `widths`, `sizes`, `loading`, and `priority` on existing Astro `<Image>` calls.

Initial width ladders:

| Surface                                   |                Suggested widths | Notes                                                                    |
| ----------------------------------------- | ------------------------------: | ------------------------------------------------------------------------ |
| Full-bleed homepage hero                  |               `900, 1400, 2000` | Already close; keep `priority`.                                          |
| Internal/page hero and large detail media |         `720, 1080, 1440, 1800` | Lead image only gets priority if visible in first viewport.              |
| Distro/release/store cards                |       `320, 480, 640, 800, 960` | Fits 1-3 column cards and high-DPR screens without 3500px downloads.     |
| Artist portraits                          |     `480, 720, 960, 1200, 1440` | Existing pattern is good; keep source crop QA.                           |
| News cards                                |      `360, 540, 720, 960, 1200` | Existing pattern is good.                                                |
| Services feature images                   |               `720, 1200, 1600` | Existing pattern is good.                                                |
| Tiny release thumbnails                   |                  `96, 160, 240` | Do not ship full album covers into 5rem slots.                           |
| Runtime/cart/checkout images              | source string plus stable frame | Raw `<img>` remains allowed; cannot use Astro metadata in browser state. |

Why: Astro already produces optimized static assets and preserves dimensions. Current gaps are mostly missing `srcset` and wrong loading priority, not lack of tooling.

Alternative rejected: run ImageMagick over the whole content tree and commit generated derivatives. That duplicates Astro/Sharp work and creates media churn.

### Decision 3: Priority Is Per View, Not Per Component

Use these rules:

- One true LCP/hero image per route may use Astro `priority`.
- The leading visible product/card set should use `loading="eager"` with normal priority, not Astro `priority`; only the likely LCP image gets `fetchpriority="high"`.
- Below-fold cards and supporting images remain `loading="lazy"` and `decoding="async"`.
- Overlay/detail fragments loaded after user action do not need initial-route priority unless direct-loaded and visible above the fold.

Why: Too many high-priority images fight each other. Lazy-loading first-viewport images causes the current distro symptom.

Implementation note: components that appear in grids may need one small `loading` prop passed from the page map by index. Default to the first 3 grid items for current 3-column desktop layouts; adjust only if Browser Use proves a different threshold. Do not add viewport-measurement JavaScript for this.

### Decision 4: Section-Specific Strategy

#### Homepage

- Keep `HomeHero` as priority full-width media.
- Confirm generated output has `srcset`, `sizes="100vw"`, no blank first paint, and stable hero crop at mobile/desktop.
- Featured roster and distro modules use card width ladders; first visible row may be eager if it sits in the first viewport.

#### Distro

- Add card widths around `320-960`.
- Pass index from `apps/web/src/pages/distro/index.astro` so the leading card set can be eager and later cards lazy.
- Keep square frame and dark background.
- No per-card spinner. Optional: subtle non-animated placeholder color or opacity fade after load.
- Source repair only for product images that are unreadable, badly cropped, or much larger than useful after responsive output is fixed.

#### Store Listing And Store Detail

- `StoreItemCard` needs card widths and index-aware `loading`.
- Store detail lead image should use large/detail widths and `priority` when the image is visible in the first viewport.
- Cart drawer and checkout summary images stay raw runtime snapshots with stable square/thumbnail frames.

#### Releases

- `ReleaseCard` needs card widths.
- Latest release feature needs large/detail widths and route-level priority if it is the first visual media.
- Artist discography and previous-release thumbnails need smaller width ladders than main cards.
- Release detail lead image gets large/detail widths and direct-load priority.

#### Artists

- Keep existing artist card widths.
- Fix source warnings through editorial review, not automatic cropping:
  - Mass Culture: landscape source cannot satisfy 3:4 roster standard without crop/art-direction choice.
  - Chronoboros: square logo may be acceptable as an exception if it is intentionally a logo, otherwise replace with portrait source.
  - Ouranopithecus: `800x1200` is portrait-ish but below the documented minimum; replace or accept warning until better source exists.
- Artist detail hero gets large/detail widths. Latest/previous release thumbnails get smaller widths.

#### News

- Keep `NewsCard` widths.
- News detail lead image gets large/detail widths and priority on direct article loads.
- No skeleton for known article content; the frame is enough.

#### Services, About, Internal Heroes

- Services feature images already use useful widths; verify output and source sizes.
- `InternalPageHero` should avoid raw unoptimized strings where a local Content Image is available; public string images remain allowed for Public Brand Assets.
- About/home journey images should use content-appropriate large/detail widths and stable framing.

#### Brand, Admin, Provider, Email

- Public Brand Assets stay in `public/`; give explicit dimensions where rendered raw.
- Admin preview images may stay raw because they preview CMS-selected strings; keep stable preview frames.
- Provider Product Image URLs continue to derive from repo content and target Product Environment.
- Email images use absolute public URLs and constrained markup; no Astro image dependency inside backend email templates.

### Decision 5: Source Tooling Is Repair-Oriented

Use tools by responsibility:

- Sharp: existing read-only QA and future scripted checks. Best fit because it is already installed and used by `pnpm assets:check`.
- Astro image pipeline: build-time responsive derivatives for the site.
- ImageMagick: manual/local source cleanup when a source file is too large, has bad metadata, or needs one-off format conversion. Example class of command for PowerShell: `magick input.jpg -resize '1800x1800>' -strip -quality 82 output.webp`.
- GIMP: manual crop/focal-point decisions where an automated crop would damage editorial intent.

Do not commit generated source replacements unless they are reviewed as content changes.

### Decision 6: Loading UI Is Quiet

Use stable aspect-ratio boxes and dark surface color. If a reveal treatment is added, use opacity only, keep it under 300ms, and disable it under `prefers-reduced-motion: reduce`.

No shimmer, bouncing loaders, or spinner per card. Those add motion/noise and imply an app data wait rather than normal media streaming.

### Decision 7: Validation Proves Output, Not Intent

Validation must inspect built/rendered output, not only source code:

- `pnpm assets:check` for source health.
- `pnpm test:unit`, `pnpm check`, `pnpm build` for repo gates.
- Generated HTML inspection for `srcset`, `sizes`, loading, and priority on representative routes.
- Browser Use at mobile and desktop widths for `/`, `/distro/`, `/store/`, `/releases/`, a release detail, an artist detail, `/news/.../`, `/services/`, and checkout/cart surfaces when touched.
- Hosted UAT/PRD header checks remain separate from local static build checks.

## Risks / Trade-offs

- More generated responsive variants increases build output size and build time. Mitigation: use small role-based width ladders, not huge global layouts.
- Marking too many first-row images eager can increase network contention. Mitigation: only the LCP image uses high priority; first-row grids are eager/auto.
- Source cleanup can destroy editorial crop intent. Mitigation: ImageMagick only for mechanical cleanup; GIMP/replacement for crop decisions.
- Public assets are not optimized by Astro. Mitigation: keep brand/admin assets small and dimensioned; do not move everything into `src` without a concrete benefit.
- Hosted GitHub Pages and Cloudflare Pages may differ in cache headers. Mitigation: validate image markup locally, then validate hosted cache behavior with existing cache-policy tooling.

## Migration Plan

1. Inventory generated image output for representative routes after `pnpm build`.
2. Add width/loading props to the missing Astro image surfaces, starting with Distro, Store, Release cards, and lead/detail images.
3. Keep existing good surfaces unchanged unless inspection shows bad output.
4. Keep `pnpm assets:check` as-is unless inventory exposes a source problem not covered by the current checks.
5. Review and optionally repair the three existing artist-source warnings.
6. Run repo gates and Browser Use visual/performance checks.
7. Recheck hosted UAT after merge; PRD cache behavior remains Cloudflare Pages-specific and is accepted through existing hosted cache policy checks.

Rollback is simple: revert component prop changes and asset-check rule additions. Source image replacements, if any, should be separate commits so editorial rollback is clean.

## Open Questions

- Should intentional logo-style artist images be allowed as explicit exceptions to the 3:4 portrait source standard?
- Should the eager grid threshold be fixed at the first 3 items per grid? Default recommendation: yes, because it matches current desktop grids and costs little on mobile.
- Should AVIF be considered after responsive WebP rollout if measured card image transfer still dominates? Default recommendation: defer.
