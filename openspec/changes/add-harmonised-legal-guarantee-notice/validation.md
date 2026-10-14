# Preparation evidence

## Scope and source

- Product Environment: Local, documentation preparation only.
- Worktree: `C:/Users/SVall/.codex/worktrees/b107/blackbox-records`.
- Branch: `codex/harmonised-guarantee-notice`.
- Base/source SHA: `dfea9e105f51e7e472dc08e535a479e7dbb2186b`.
- User superseding instruction: Claude Desktop owns all UI edits, including rendered text. No UI, backend, schema, source content fixture or live CMS change was made.
- Read all four active change proposals before creating this uniquely named change. Existing unrelated changes remain untouched.
- `pnpm openspec:guard --allow-worktree` passed; all OpenSpec commands use the guarded `pnpm openspec -- ... --allow-worktree` path.

## Research and source inspection

The [legal record](legal-research.md) contains official EU/Greek sources and hashes of retained Gazette PDFs. Law 5326/2026 article 106 is the relevant commencement correction; the notice applies from 27 September 2026. No live CMS behaviour is inferred from the pending source fixture.

The initial focused Graphify query failed because this newly created worktree had no graph file. CodeGraph reported no `.codegraph` index and instructed against further queries in this session. Scoped exact reads established the handover edit points. Creating the authorized local branch subsequently triggered the repository checkout hook to bootstrap CodeGraph and build Graphify. A later Graphify query found the checkout component but exceeded its 2500-token budget; its broad relationships are not accepted as complete evidence. The bounded path query between `CheckoutOfferStatus()` and `DeliverySummary()` is limited to that seam. No substantive code edit batch requires an additional graph refresh, and CodeGraph is not claimed as consulted source evidence.

## Acceptance boundaries

- Documentation/planning validation is applicable; final run receipt is recorded under ignored `.codex-artifacts/guarantee-notice/`.
- Shell/player/routing, checkout, CMS publication and browser acceptance are not claimed: this delivery changes no product source and the user assigned UI to Claude Desktop. Tasks 2–3 stay open.
- No hosted request to BlackBox, provider mutation, purchase, email, push, deployment or publication was performed.
- Official assets, user-approved preview, readable presentation, complete accessible transcript and implemented behaviour remain unverified until Claude completes the handover.

## Checks

- Strict guarded OpenSpec validation passed for `add-harmonised-legal-guarantee-notice`.
- `pnpm validate` passed 18 selected tasks, 16 with matching cached outputs, in `mode: local`. Summary: `.codex-artifacts/validation/2026-10-14T08-59-31-648Z-62488-9e543d/summary.json`. Its before/after source fingerprint matches: `838b82aec276ee1b029d8b87b4db59fe40aac4f027a27501c1696eb83e566375`; source SHA is the base SHA above.
- `git diff --check` passed. No product code changed, so no new implementation test or browser run is claimed.
- The final rerun after these documentation edits and task updates is recorded in ignored `.codex-artifacts/guarantee-notice/completion.json`, including its source-bound summary and local commit identity. The earlier summary above is retained as an intermediate check, not evidence for later edited documentation.
- No check was waived and no full-project grant was requested.

## Official assets (downloaded 14 October 2026, owner authorized)

Source page: https://commission.europa.eu/publications/practical-guidelines-and-high-resolution-vector-files-eu-notice-and-label-product-guarantees_en

| Package                                                                                             | SHA-256                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `SVG.zip` ("EU notice in all EU languages … zipfile with SVG")                                      | `6797b40b19af8c26906ef31b8aec3351685b9b6fb4d3d9a3bffa90f14bdf6b84` |
| `Harmonised notice in 24 languages colour and black and white_0.zip` (PDF, used for the transcript) | `baae862aabc57e79ae28ebc2dcfb445f5c8ec768bb558b8518b1f2c3b928c992` |

| Original file                            | Shipped as                                                          | SHA-256 (byte-identical)                                           |
| ---------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `Legal guarantee_notice EN.svg` (colour) | `apps/web/public/assets/images/legal/legal-guarantee-notice-en.svg` | `d1b4293b75637022b582b3025f789d292e1c845660a0460d855bbe523b9763f7` |
| `Legal guarantee_notice EL.svg` (colour) | `apps/web/public/assets/images/legal/legal-guarantee-notice-el.svg` | `cb474fb5261ed80aa1e21695d07268b39897e2d8043e69c6988907f879c2f428` |

Both SVGs contain no script or external reference. Their text is outlined, so the transcripts in `LegalGuaranteeNotice.tsx` were taken from `Legal guarantee_notice ENN.pdf` (pdftotext) and read from `Legal guarantee_notice ELN.pdf`. `statutory-disclosures.test.tsx` pins both hashes.

## Implementation checks (14 October 2026)

- `pnpm test apps/web/src/platform/components/statutory-disclosures.test.tsx`: passed (closed disclosure, artwork, links, transcripts, checkout-only placement, file hashes).
- `pnpm test:e2e e2e/international-order-checkout.spec.ts -g "legal guarantee"`: 2 passed (1280px desktop, 390px phone): closed until clicked, artwork loads, Greek and EU links, transcript, payment state and newsletter checkbox unchanged, no horizontal overflow.
- Still unverified: 200% zoom and enlarged text with the notice open, image failure, no-JS checkout rendering, hosted delivery.

## Additional Codex local acceptance, 14 October 2026

Source: clean `de14a9f9f99e0fdbc444bc1ecd98fce20fd8fd48`; no product/UI edits. `pnpm test:e2e e2e/international-order-checkout.spec.ts -g "legal guarantee"` passed both desktop Chromium and Chromium phone cases. Playwright CLI additionally exercised the existing checkout at 320, 390 and 1280px in Chromium and Windows WebKit with JavaScript disabled: native keyboard opening, full English/Greek transcripts and zero document horizontal overflow passed. With both notice SVGs blocked, the text alternative and existing links remained accessible. A 200% CSS-zoom simulation also had no document overflow. Screenshots were inspected; the official artwork is dense on a phone and full-size/text alternatives remain necessary. This is not a finding that changes the approved layout, nor acceptance of human readability at normal size.

Probes/results/screenshots: `.codex-artifacts/compliance-review-20261014/local-acceptance/check-public.js`, `public-result.txt`, `webkit-public-result.txt`, `guarantee-nojs-390.png` and `guarantee-css-zoom200.png` (the latter screenshots show the final WebKit run). The first exploratory probe had an ambiguous Greek locator; the final probe targets the transcript div and passed. Real browser-menu zoom, enlarged-text settings, screen-reader experience, normal-size readability and hosted delivery remain unverified; task 3.1 stays open. Final documentation validation is recorded in that directory's `completion.json`; no publication/deployment is implied.
