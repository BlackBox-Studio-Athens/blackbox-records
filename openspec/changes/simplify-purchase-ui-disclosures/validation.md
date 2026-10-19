# Local acceptance record

## Scope and authorization

The user approved the interactive purchase-flow draft and requested local implementation and a local commit on primary `main`, with the rest of the layout and required disclosures preserved. Human Local review precedes any deployment. No push, deployment, catalog publication or provider acceptance is authorized by this change.

The implementation retains the existing page composition, artwork, typography, responsive column order, cart actions, player integration and commerce authority. It changes the header bag to the existing ghost control, places the official white Stripe badge below the existing payment action, removes redundant item prose and puts authoritative costs before conditional order notices. Existing item pre-order facts and legacy checkout recovery guidance remain available.

## Preserved disclosures

- Full accepted delivery, returns, privacy and withdrawal documents remain in their existing policy routes and global navigation.
- Item pages state the Greece-only BOX NOW restriction and link to Delivery & returns. The shared shipping sentence now reads “Shipping calculated in your cart.”
- Checkout retains the accepted full delivery summary, including the street-address/home-delivery clarification, before payment.
- Pre-order estimates, full payment today and mixed-order delay remain conditional on actual offer/cart state. An unavailable quote still blocks payment.
- Optional newsletter consent and its adjacent Privacy information link retain their previous behavior.
- The original legal-guarantee component, official English/Greek artwork and text transcripts remain unchanged; its expandable entry now follows the payment handoff. Product-safety disclosures and global/after-purchase withdrawal access remain unchanged.

## Automated evidence

- Focused suites pass: checkout-web 155 tests, web-platform 74, store-cart 145, web-store 154, web-pages 77.
- Strict OpenSpec validation passes for `simplify-purchase-ui-disclosures`.
- `graphify update .` completed once after the source batch. Existing extractor limitations: missing SQL grammar, partial extraction of `scripts/pages-workflow-contract.test.ts`, and files with no extracted symbols. No graph tooling dependency was added.
- Final `pnpm validate` passes, Local scope all, 53 tasks: `.codex-artifacts/validation/2026-10-19T23-26-56-990Z-40680-29ab65/summary.json`.
- Validation before/after source fingerprint: `55f267c07bbc72c1e260dd14009f699f999f57d4a33fe2733aad49a1b36f6aae`.
- Extended `e2e/checkout-review-order.spec.ts` covers compact stocked/pre-order item copy and checkout at 320, 390, 768 and 1440px; badge position/loading, cart transparency/target size, cost totals, consent/keyboard path, withdrawal access and desktop payment fit.

## Browser acceptance and review

Pending compiled Local runtime refresh and browser execution. The existing Local stack on port 4321 belongs to the previous completed release-controls task and serves pre-change compiled output. Restart permission has been requested under the Local process-ownership rule. No process has been stopped, accepted snapshot republished or catalog data changed while that request is pending.

## Concurrent work and limits

The initial dirty-file baseline is `.codex-artifacts/purchase-ui/baseline-dirty-hashes.json`; the starting index was empty. Only this change's additions to the already-dirty `DESIGN.md` and `global.css` belong in the local commit. All other baseline dirty files remain byte-identical. Source changes do not modify API shapes, content schemas, policy facts, charges or consent rules.

This record establishes Local repository checks only until browser evidence is added. Hosted legal configuration, Greek-specific legal interpretation, real Stripe/provider checkout, physical devices and release acceptance are outside this Local presentation change. Human review is still required before deployment.
