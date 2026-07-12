## 1. Add the Persistent Header Marker

- [x] 1.1 Declare private build-time `SHOW_REVIEW_SITE_MARKER?: 'true'` typing and derive marker visibility only from exact equality with `true`; do not expose a `PUBLIC_*` value or infer from a hostname.
- [x] 1.2 In `Header.astro`, group the existing wordmark with one conditional static marker using visible copy `Review site · test payments` and an assistive label with sentence punctuation; add no component abstraction, state, link, role, or hydration.
- [x] 1.3 Add the smallest global header styles needed for left-aligned 11px Soft Muted text beneath the wordmark; preserve the 80px header, logo dimensions, navigation/control alignment, one-line copy at default text sizing, and no-animation/no-container treatment.

## 2. Enforce the UAT-Only Build Boundary

- [x] 2.1 Set `SHOW_REVIEW_SITE_MARKER: 'true'` only on the existing `Build UAT static frontend` step in `.github/workflows/pages.yml`; leave Local, full PRD, PRD Holding Page, and diagnostic build scopes unset.
- [x] 2.2 Extend `scripts/verify-environment-model.ts` to fail unless the exact UAT flag/value, conditional header guard, and public copy are present and no PRD build scope enables the flag.
- [x] 2.3 Extend the existing UAT Static Smoke `public_routes` checks so every representative shopper HTML route must contain the exact marker, with a clear missing-marker issue in recorded evidence.
- [x] 2.4 Add focused unit coverage for the new environment-model and UAT smoke assertions using existing test seams; add no package, verifier script, or snapshot framework.

## 3. Document Review-Site Meaning

- [x] 3.1 Update `README.md` and `docs/environment-model.md` to define Review Site Marker, its UAT-only scope, its exact public wording, and the rule that it does not control checkout or payment authority.
- [x] 3.2 Add a short non-technical link-sharing template stating that the URL is for review and payments are tests, while keeping UAT/platform vocabulary out of shopper-facing UI.
- [x] 3.3 Update the affected `uat-review-marker`, `static-site-and-deployment`, and `project-language` baseline specs after implementation without changing Product Environment names or PRD launch policy.

## 4. Verify Both Static Build Outcomes

- [x] 4.1 Run the focused environment-model and UAT Static Smoke unit tests, then run `pnpm test:unit`, `pnpm check`, and `pnpm build` against the exact implementation tree.
- [x] 4.2 Build the GitHub Pages target with `SHOW_REVIEW_SITE_MARKER=true` and verify representative emitted shopper documents contain one exact marker; build the normal PRD target without the flag and verify the marker is absent.
- [x] 4.3 If the PRD Holding Page artifact is already implemented, run its artifact check and verify it also contains no Review Site Marker; otherwise record this as an acceptance dependency of `publish-prd-holding-page` rather than adding compatibility code.
- [x] 4.4 Use Browser Use against the local UAT-shaped build at a 320px CSS mobile viewport and desktop width to verify full copy, AA contrast, no wrap/overflow, unchanged header height, reduced motion, and console cleanliness; separately verify 200% browser page zoom with a resulting CSS viewport of at least 320px.
- [x] 4.5 In the same Browser Use pass, verify marker persistence through direct page loads, header/footer/mobile section changes, a detail overlay, mobile navigation, cart drawer, and player open/minimize/reopen/stop states.

## 5. Accept the Hosted Review Surface

- [x] 5.1 After the normal shared workflow deploys the verified commit, run UAT Static Smoke `public_routes` and retain passing evidence that every representative route contains the marker.
- [x] 5.2 Use Browser Use on the deployed GitHub Pages UAT URL at mobile and desktop sizes to repeat header-persistence, control-clearance, accessibility, network, and console checks.
- [x] 5.3 Share the review URL using the documented non-technical template only after hosted checks pass; record that the marker is presentational and that checkout remains governed by Worker and Stripe controls.
- [x] 5.4 Re-run `pnpm openspec:guard`, strictly validate this change, and record final OpenSpec status before archiving.

## 6. Add Layered Test-Site Cues

- [x] 6.1 Replace the subtle header sentence with a solid `TEST SITE` label and adjacent `Test payments only` text, preserving the existing private build flag, 80px header, accessibility contract, and 320px support.
- [x] 6.2 Prefix only the UAT HTML document title with `[TEST] ` while leaving canonical, Open Graph, Twitter, and structured metadata unchanged.
- [x] 6.3 Pass the private UAT build decision from both Astro checkout routes into the hydrated checkout component and render `Test checkout. No real payment will be taken.` beside the final Stripe action without adding browser configuration or changing checkout authority.
- [x] 6.4 Update the existing verifier, hosted smoke, focused tests, docs, change specs, and baseline specs for all three exact cues.

## 7. Reverify and Accept the Layered Marker

- [x] 7.1 Run focused tests, `pnpm test:unit`, `pnpm check`, and `pnpm build`; prove all cues are present in UAT artifacts and absent from Local and PRD artifacts.
- [x] 7.2 Use Browser Use at desktop, 320px mobile, and 200% zoom to verify header fit and persistence, `[TEST]` title behavior, checkout warning placement, coexistence with layered UI, and console cleanliness.
- [x] 7.3 Run independent Brooks Review and Ponytail Review passes, assess and fix valid findings, then rerun affected checks and all required gates.
- [x] 7.4 Commit and push the exact verified tree, monitor required GitHub Actions and UAT deployment to terminal success, then repeat hosted smoke and Browser Use acceptance.
