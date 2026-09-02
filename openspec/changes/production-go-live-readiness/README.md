# production-go-live-readiness

Track final PRD-open launch gates for native commerce after UAT evidence.

## PRD Holding Page handoff — 2026-09-01

- `https://blackboxrecordsathens.com/` serves the isolated PRD Holding Page from the existing Pages `holding` branch; `www` and apex HTTP requests canonicalize to the HTTPS apex with exact-host `308` redirects that preserve path and query.
- Closure deployment run `33521213349` succeeded from `main` SHA `50b3ecbae6618cf96b7a9a620fa290973f03a00a`. Public DNS/TLS, canonical/noindex metadata, desktop/390 px rendering, contact actions, console cleanliness, and holding-only `404` isolation passed.
- Immediate holding rollback removes the two named redirect rules and proxied `www` CNAME; the verified holding branch remains available. Repoint the apex only during an approved full-site cutover or if restoring a recorded prior target.
- This handoff does not satisfy Stripe, PRD Worker, D1, catalog, webhook, provider, full-site custom-domain cutover, go/no-go, holding retirement, or post-launch cleanup gates. Those remain owned by this change.

## Completed prerequisite evidence — 2026-09-02

- Site performance: archived under `2026-08-31-site-performance-program`; accepted measurement commits `8469799f` and `2b96bbd7`. Store was deliberately reserved for the post-commerce remeasurement owned by this change.
- Environment alignment: archived under `2026-08-31-align-cloudflare-environment-names`; accepted completion commit `8a8d5c64`. Local/UAT/PRD naming and the UAT runtime target were verified, and obsolete GitHub environment controls were removed.
- Decap editor: archived by `50b3ecba`; accepted behavioral commit `55f69d7c`. Static, CMS asset, and CMS admin runs `33513979001`, `33514374291`, and `33514591960` passed, including an owner no-publish walkthrough with no commerce controls exposed.
- Holding Page/domain handoff: archived by `ec0bfe64`. Closure run `33521213349` passed on source `50b3ecba`, proving apex hosting, HTTPS, exact-host redirects, holding metadata, responsive rendering, console cleanliness, and the retained holding rollback target.
- Operator Access/JWT: archived by `2fd6ab63`. Hosted allowlisted access, verified JWT identity, missing/forged assertion denial, and no-net-mutation checks passed.
- Production controls: implementation commit `42a39a59`, archived by `96a1ef12`. Live catalog confirmation, shopper launch approval, and the runtime checkout feature gate are independent and fail closed.

These references prove completed prerequisites only. They do not authorize Stripe, PRD data, checkout, DNS, or public launch mutations.

## Post-commerce Store measurement — 2026-09-02

- Baseline commit `81ce9976` transferred 5,761,330 bytes for Store All and 5,514,396 bytes for Store Distro under the declared mobile-stress profile; median LCP was about 3.26 seconds on both routes.
- Implementation commit `46a78e3f` gives Store Item and Distro Coverflow images the bounded `(min-width: 40rem) 16rem, 56vw` slot while preserving ordinary catalog sizes. Transfer fell to 3,054,690 bytes for Store All and 3,330,724 bytes for Store Distro; median LCP improved to 2.68 and 2.76 seconds respectively.
- Store activation passed three of three runs with 104 cards settled, one listing-price projection, zero per-card Store Offer reads, and zero Store 5xx responses. The static-only local projection remained the expected classified `404`.
- Browser Use passed direct and shell-managed Store All/Distro at desktop and 390 px: bounded images remained visually sharp, Next/Previous and View all/Show Coverflow worked, complete card graphs remained present, focus reset to `MAIN` after shell navigation, and no overflow, blank state, or console warning/error appeared.
- Wide Store traversal passed cleanly. Store Distro still produced isolated first-traversal long-task/layout outliers in wide, mobile, and legacy profiles, and both mobile LCP results remain above the 2.5-second gate.
- Decision: retain the truthful image-slot fix, keep the bounded child active, and do not add loading machinery. The next design revision must test the measured remaining three-eager-cover contention before any implementation changes loading priority.

Raw output is ignored under `.codex-artifacts/runtime-performance/81ce9976/` and `.codex-artifacts/runtime-performance/46a78e3f/`.
