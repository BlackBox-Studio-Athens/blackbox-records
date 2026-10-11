# Local acceptance, 5 October 2026

Implemented directly on main with three fresh `gpt-6.1-sol` threads at `max`, with parent integration and verification. No commit, hosted deployment, content publication or stock mutation belongs to this follow-up. Preserve the separate Stripe migration change and existing worktree runtimes.

## Source and repository evidence

- Base HEAD: `d43f261c36979209c307451dd62fdee988e007c3`, plus this uncommitted main working tree.
- Implementation `pnpm validate`: passed in 92.9 seconds, mode `local`, 25 affected/dependency tasks. Summary: `.codex-artifacts/validation/2026-10-05T20-16-25-725Z-14992-993653/summary.json`. Matching before/after fingerprint: `3ef086d166a8df78a420f80907952c855747148da55cade6c38afe30ba2e6012`; no source changes during the run. Its formatting changed only two OpenSpec delta documents.
- Final validation after the geometry assertion and this evidence note is recorded by `.codex-artifacts/mobile-followup/final-validation.json`; that ignored pointer holds the final summary identity and matching fingerprints without creating a self-referential tracked note.
- `pnpm openspec:guard` and strict validation of `refine-mobile-release-and-shipping-hints` passed. The shipping delta modifies the existing email-order requirement, including its automatic-hint lifetime, rather than leave contradictory requirements.
- Both existing graphs informed implementation. Combined local AST Graphify refresh passed: `.codex-artifacts/mobile-followup/graphify-update.log`. It reported a pre-existing partial extraction warning for `scripts/pages-workflow-contract.test.ts`; no paid enrichment or relabeling was run. CodeGraph provided exact source and affected callers.

## Selected acceptance

Shell/player, public presentation and shipping-notice presentation apply. Staff/CMS writes, publication, provider payment and software-release rows do not apply: no corresponding authority or hosted behavior changed.

- Home removes the background text control and preference override. Eligible automatic motion retains a 44px pause/resume icon. Reduced motion and data saving remain poster-only; explicit Watch, Close, clip switching, visibility handling and shell-owned playback remain usable. Selected Home E2E: 12 passed across Chromium and Firefox in 46.2 seconds. `.codex-artifacts/mobile-followup/home-e2e.log` and `home-e2e-summary.json` retain the evidence.
- Releases uses one 16px mobile gutter, complete unscaled covers, aligned wrapping identity/actions and 44px touch targets, with full supporting artwork on phones and a tablet split. Responsive image sizes match the new slots. Desktop layout and native artwork/title/artist/purchase/listening destinations retain their behavior.
- Country hints are shared only within a document; full reload refreshes them and ignores legacy automatic session hints. An explicit "Deliver to Greece" correction updates all shared placements, survives tab reload when storage is available, wins over late hints and can be changed back. Storage failure retains in-memory behavior. Unknown, failed, `XX` and `T1` hints stay quiet without an explicit international choice. Greek address validation remains authoritative.
- Focused country/notice tests: 146 passed, with 39 existing fulfillment tests passed separately. Red/green reproduction and fulfillment logs are `.codex-artifacts/validation/international-country-{red,green,fulfillment}.log`. The mobile Releases thread also passed 384 focused editorial/shell tests; the implementation validation includes the affected consumers.
- The initial combined Store/item/cart/checkout and Releases browser run passed all 35 international tests. Country code did not change afterwards. Evidence: `.codex-artifacts/mobile-followup/release-and-country-e2e.log` and `release-and-country-initial-summary.json`.
- The fresh Releases run passed 27 of 28 checks; its single remaining failure compared DOMRect edges differing by `0.0000153` CSS pixels in Firefox. The gutter assertion now permits `0.01` CSS pixel rounding and still rejects meaningful overflow. All 10 width checks then passed in Chromium and Firefox at 320, 360, 390, 430 and 768px. The remaining 18 Releases checks passed on the unchanged implementation, including desktop composition, stale-offer neutralization, inert copy, native destinations, purchase and shell listening. Evidence: `.codex-artifacts/mobile-followup/releases-fresh-{e2e.log,summary.json}` and `releases-gutters-e2e.log` with final `e2e-summary.json`. This establishes 75 distinct selected browser checks across Home, notices and Releases; reruns are not counted twice.

## Visual and Local runtime evidence

- Native Chrome, Blackbox profile: before/after views and width measurements at `.codex-artifacts/e2e/releases-mobile/before-purchase-390.jpg`, `after-390.jpg` and `widths.json`. Parent inspected the mobile after image; the worker restored the shared viewport before final handoff. Live offer fixtures made visual comparison deterministic without stock mutations.
- Main source preview: `http://127.0.0.1:4361/blackbox-records/releases/`, with Home at `http://127.0.0.1:4361/blackbox-records/#preorders`. The Codex browser-open request was queued for this task; direct links remain available. The preview stays running.
- This preview reads the primary checkout's existing accepted Local snapshot: publication `4c8aed0a-9e8b-4546-8afe-5cf15d107476`, snapshot SHA256 `6f14c504989d81a975685ef3aca135342f8d5c1ce035da6848345a4d39cefb7a`, with the existing Local backend at port 8787. No reseed or publication was performed.
- An ignored Playwright configuration preserves the repository profiles/settings while pointing scoped `pnpm test:e2e` to the dedicated main source port. The standard port remains owned by the earlier worktree stack; no lease was removed or shared stack stopped.
- Astro lost accepted local image imports during hot reload. Parent interrupted that browser attempt and restarted only its owned port-4361 preview. Fresh `/releases/` returned HTTP 200 with working image responses, then the scoped browser checks passed. The interrupted log is `releases-final-e2e.log`; the current server log is `.codex-artifacts/mobile-followup/site-main-fresh-dev.log`.

## Limits

Actual Horizon eSIM/COSMOTE IP geolocation and a physical smartphone have not been observed. Foreign eSIM network routing is plausible, not a verified diagnosis; stale automatic hints were reproduced. The correction handles both cases without language/timezone guesses or precise-location permission. Local results do not establish UAT/PRD deployment, real payment/provider acceptance or new catalog publication. Those environments still serve the prior release.
