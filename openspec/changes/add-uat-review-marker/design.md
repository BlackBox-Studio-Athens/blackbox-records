## Context

The visible UAT site is intentionally close to the final site, so a shared link gives non-technical reviewers no reliable cue that they are looking at a review environment with test payments. The current fixed header is the stable visual landmark on every shopper page: `SiteLayout.astro` renders `Header.astro` outside the `<main>` content that `AppShellRoot` swaps during same-document navigation.

`Header.astro` currently has three direct layout children: the wordmark, desktop navigation, and cart/mobile controls. The header is 80px high at every breakpoint; its content uses 18px mobile and 32px desktop side padding. The wordmark is approximately 144–154px wide and already leaves enough space at 320px for a short second line without changing the header or control geometry.

The shared deployment workflow already has isolated UAT and PRD build steps. UAT builds for GitHub Pages with a base path and UAT Worker URL; PRD builds separately for Cloudflare Pages. The existing environment-model verifier checks that separation, and the UAT Static Smoke `public_routes` scenario already probes representative direct route loads.

This is a product-interface status cue, not a campaign surface. Physical scene: a colleague opens a shared link on a phone during a content review and should understand its status before tapping Store. Voice: **calm, editorial, unmistakable**.

## Goals / Non-Goals

**Goals:**

- Make every shopper-facing UAT page visibly identifiable as a review site with test payments.
- Preserve the current BlackBox header hierarchy, dimensions, navigation, cart, player, and overlay behavior.
- Keep the exact full marker legible from a 320px CSS viewport through wide desktop and at 200% browser page zoom when the resulting CSS viewport remains at least 320px.
- Make marker presence an explicit UAT build contract with automated drift and hosted checks.
- Keep Local and all PRD artifacts unmarked by default.

**Non-Goals:**

- Changing checkout availability, Stripe mode, payment authority, stock, content, or any Worker behavior.
- Adding a top banner, alert styling, badge pill, icon, tooltip, link, dismissal, animation, or saved state.
- Showing `UAT`, provider names, platform vocabulary, a test-card number, or technical instructions in the public header.
- Adding a CMS setting, runtime configuration endpoint, hostname inference, component library primitive, dependency, or reusable abstraction for one static marker.
- Changing the header height, app-shell route model, full-site design, UAT URL, PRD Holding Page, or production launch policy.

## Decisions

### Place one text line directly beneath the wordmark

`Header.astro` will wrap the existing `HeaderBrand` and a conditional static `<span>` in one identity group. The marker sits directly beneath the wordmark, left-aligned to it. This ties status to the most stable identity element and keeps it visible while desktop navigation, the mobile sheet, cart drawer, player, or detail overlay changes state.

The exact visible copy is `Review site · test payments`. It uses the existing system sans face, Soft Muted `#b3b3b3`, 11px type, 1.2 line height, restrained letter spacing, and no text transform. The full phrase remains on one line at default text sizing. It receives no border, background, rounded container, shadow, icon, route accent, or motion. A screen-reader label may replace the middle dot with sentence punctuation, but the visible words remain exact.

The identity group adds only a small vertical gap within the current 80px header. Existing logo sizing, header padding, navigation alignment, right-side control size, and page top offsets remain unchanged. At a 320px CSS viewport with default text sizing, the full marker must remain visible on one line without clipping, collision, or horizontal overflow; it is never shortened to an acronym or hidden behind a tooltip. A separate 200% browser page-zoom check uses a viewport whose resulting CSS width remains at least 320px and requires the same no-loss outcome. These are separate acceptance cases, not a demand to fit 200% text-only enlargement into a 320px layout.

A separate announcement bar was rejected because it would shift every page, compete with the site content, and look like a temporary warning. A pill beside the desktop navigation was rejected because it would disappear or crowd the mobile header. Duplicating the marker inside the mobile sheet was rejected because the fixed header remains visible and duplicate status adds noise.

### Compile the marker only when an explicit private flag is exactly true

The build contract uses `SHOW_REVIEW_SITE_MARKER=true`. `Header.astro` compares the value to the exact string `true`; missing, blank, or any other value renders nothing. `apps/web/src/env.d.ts` declares the private build-time value without a `PUBLIC_` prefix because browser code does not need it.

Only the `Build UAT static frontend` step in `.github/workflows/pages.yml` sets the flag. Local commands, UAT-connected local development, the full PRD build, the PRD Holding Page build, and preview/diagnostic builds leave it unset. This makes absence the safe default and prevents a shared repository variable from leaking review language into PRD.

Hostname detection was rejected because local base paths, Pages aliases, custom domains, and preview URLs make URL inference brittle. A content setting was rejected because review identity is deployment policy, not editorial content. A client-visible public variable and hydrated component were rejected because the marker is resolved completely at static build time.

### Keep the marker inside the existing persistent-header boundary

No React state or app-shell integration is needed. The header is outside `main[data-app-shell-main]`, so shell-managed section swaps cannot remove or duplicate the server-rendered marker. Direct page loads receive the same layout and marker. Opening or closing the navigation sheet, cart, player, or detail overlay does not change it.

No `aria-live`, status role, focus target, or click behavior is added; the marker describes stable page context rather than a changing event. Its text must meet WCAG AA contrast against the translucent near-black header and remain understandable without color.

### Extend existing verification seams

`scripts/verify-environment-model.ts` will assert that the exact flag/value occurs in the UAT build step, is absent from PRD and holding build scopes, and guards the exact header copy. Its existing output remains the repository-level drift check; no new verifier script or package dependency is added.

The existing UAT Static Smoke `public_routes` scenario will require the exact marker on every representative shopper route it already probes. Focused unit coverage will preserve any new smoke assertion helper or configuration check. Browser Use will verify the final UAT artifact at 320px mobile and desktop, shell navigation persistence, mobile navigation, cart/player/overlay coexistence, zoom, and console cleanliness.

## Risks / Trade-offs

- **The marker is too subtle to prevent confusion** → Keep the unambiguous full words, AA contrast, permanent header placement, and include them in review-link instructions; do not rely on color alone.
- **The marker crowds a narrow header** → Keep it under the existing wordmark, lock one-line copy, preserve control geometry, and reject implementation unless 320px and text-scaling checks pass.
- **Review language reaches PRD** → Use an unset-by-default private flag, scope it to the UAT build step, and make source/workflow verification fail on drift.
- **The header cue implies test behavior is browser-owned** → Keep the marker presentational only; Worker feature gates and Stripe environment controls remain authoritative.
- **A future header redesign drops the cue** → Hosted `public_routes` smoke fails when the exact marker disappears from UAT.

## Migration Plan

1. Add the conditional identity group and existing-system styles without changing header dimensions or behavior.
2. Declare the private flag, set it only in the UAT build step, and extend repository verification and focused tests.
3. Build both targets and prove the marker is present in the UAT artifact and absent from the full PRD and PRD Holding Page artifacts.
4. Run repository gates, then use Browser Use locally with the flag enabled at mobile and desktop sizes plus a separate 200% page-zoom case whose resulting CSS viewport remains at least 320px.
5. Deploy through the existing shared workflow and run hosted UAT Static Smoke plus manual Browser Use checks before distributing the review link.

Rollback: remove the UAT build flag or revert the marker commit, rebuild UAT, and rerun the same hosted checks. No data, DNS, Worker, Stripe, or PRD rollback is required.

## Open Questions

None. Copy, placement, environment scope, visual treatment, validation seams, and non-interactive behavior are fixed by this plan.
