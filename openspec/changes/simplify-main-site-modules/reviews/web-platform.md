# web-platform — received review

Reviewer thread: `01a1254f-c525-7510-b076-d9680a842172`.

Received by fresh implementer thread `01a1257e-ee26-73e1-8251-37104454413d` on 2026-10-10. The review source is the full review supplied in the module assignment. Reviewer source identity: branch `main`, HEAD `3355c335226838f996efb5536f55271f819a3e14`, module fingerprint `32e04d089ad30dc35d38159dae3d1f2311de0d3b130f83990b15d120da2bae4e`. Independent pre-edit verification reproduced that fingerprint over all 24 tracked module files.

The complete received review follows unchanged.

---

What this change does: This is a read-only review of `web-platform`, which owns shared public-site configuration, URL handling, prose, purchase information, image helpers, scrolling, and private-preview behavior. Two concrete simplifications are supported by source, caller, and test evidence. Together they could remove approximately 34 lines while preserving the public module interfaces and rendered behavior.

The review covered the existing `main` checkout at `C:/Users/SVall/WebstormProjects/blackbox-records`. No project files, task records, or reports were written. No commits, graph rebuilds, enrichment, paid API calls, or hosted mutations were performed.

**Should fix**

1. **Delete the unused configured-fetcher wrapper and its isolated tests.**

   - **What this is:** [apps/web/src/platform/lib/backend/api-client.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/platform/lib/backend/api-client.ts:5), lines 5–12, combines backend URL resolution with the shared public API-fetcher factory. It returns `null` when configuration is absent.
   - **Problem and proof:** The only consumer is [api-client.test.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/platform/lib/backend/api-client.test.ts:3), lines 3–14. Repository-wide symbol/import searches found no production reference, and the targeted Graphify explanation likewise showed only that test importing the function. This file is absent from the public entrypoint list in [project.json](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/platform/project.json:18). It is an unused internal composition, despite its TypeScript `export` declaration.
   - **Connected caller evidence:** Live checkout requests use `createPublicApiFetcher` directly in `apps/web/src/components/store/checkout/public-checkout-api.ts:29`, `:77`, `:157`, and `:164`. Configuration comes through `public-checkout-presentation.ts:11–12`, which converts the retained platform resolver’s `null` result to `''`. The preorder showcase also uses `getPublicBackendBaseUrl` directly at `apps/web/src/components/store/StorePreorderShowcase.tsx:21`. Neither flow passes through the unused wrapper.
   - **Smallest change:** Delete only `apps/web/src/platform/lib/backend/api-client.ts` and `apps/web/src/platform/lib/backend/api-client.test.ts`. No caller rewrites, replacement helper, or boundary metadata changes are needed.
   - **Behavior to preserve:** Keep `getPublicBackendBaseUrl`, its preview override, trimming and slash normalization, and the shared fetcher unchanged. Preserve the live checkout resolver’s empty-string fallback and the shared factory’s `cache: 'no-store'` configuration. Replacing live clients with the unused nullable wrapper would introduce a different contract and is outside this finding.
   - **Test deletion justification:** The deleted tests assert only the unused wrapper’s `null` result and the presence of `.configure`. Configuration behavior remains covered by `apps/web/src/platform/lib/backend/public-backend-config.test.ts:5–24`. Factory creation, real mocked checkout responses, error JSON, and no-store configuration remain covered in `packages/api-client/src/client-factories.test.ts:11–16`, `:25–33`, `:47–75`, and `:77–97`. The latter file changed concurrently; its current contents were re-read before this report. No distinct regression test for an exercised production path is lost.
   - **Focused validation:** Recheck symbol and import references immediately before deletion, then run `pnpm test web-platform`. Retain the shared factory and configuration coverage; do not edit their owners as part of this module assignment. The parent’s final affected validation should check consumers and boundaries after concurrent implementations settle.
   - **Expected net reduction:** **29 lines:** 13 production lines and 16 test lines, with two files removed and no replacement code.
   - **If we skip it:** An unused API-client layer and tests for that layer remain in the maintenance surface.

2. **Reuse the existing delivery-summary value in both purchase-information presentations.**

   - **What this is:** [apps/web/src/platform/components/PurchaseInformation.tsx](C:/Users/SVall/WebstormProjects/blackbox-records/apps/web/src/platform/components/PurchaseInformation.tsx:26) renders a default item-page summary and a compact checkout summary.
   - **Problem and proof:** Lines 28–30 compute `information?.terms.delivery.summary ??` the fixed locker-delivery fallback. Lines 52–57 repeat exactly the same selection and fallback statement in the default presentation. For example, `information={null}` selects identical fallback prose on both surfaces. The duplication gives the same delivery statement two places to drift.
   - **Connected caller evidence:** The Store Item page renders the default presentation at `apps/web/src/pages/store/[slug]/index.astro:184`. Checkout renders the compact presentation through `apps/web/src/components/store/checkout/DeliverySummary.tsx:121`. Purchase data comes from the static JSON-backed reader or the hosted replacement readers; `packages/content-model/src/purchase-information-schema.ts:11–18` requires both dispatch and delivery sections. The observed inputs are content records or `null`.
   - **Smallest change:** Move the existing `deliverySummary` declaration immediately above the presentation branch and use `<Prose value={deliverySummary} />` in both branches. Keep both JSX layouts otherwise intact. This needs no new component, shared constant module, or abstraction.
   - **Behavior to preserve:** Keep the exact fallback wording and `??` semantics, including rich-text values. The default presentation must still render dispatch before delivery and retain its conditional privacy link. Checkout must keep its compact classes and support links. Preserve draft visibility, link order, base-path handling, `data-purchase-information`, and server-rendered output.
   - **Retained evidence:** `apps/web/src/platform/lib/purchase-information.test.tsx:16–42` checks formatted prose, safe HTML escaping, and purchase rendering; `:74–83` checks production draft suppression and fallback copy; `:85–105` checks document sections and summaries. `apps/web/src/components/store/checkout/DeliverySummary.test.tsx:60–100` exercises the checkout composition with quoted, unavailable, loading, and custom-price states. These checks should remain.
   - **Focused validation:** Run `pnpm test web-platform` and `pnpm test apps/web/src/components/store/checkout/DeliverySummary.test.tsx`. Compare before/after static HTML for both presentations using `null`, ordinary validated text, and rich delivery prose. This small refactor does not need a new test abstraction. For coordinated Local browser acceptance, existing focused paths are `e2e/international-order-item.spec.ts` and the `the checkout pay control fills in place when the shipping quote arrives` test in `e2e/store-cart.spec.ts`.
   - **Expected net reduction:** Approximately **5 production lines**, with no test deletion. Any additional retained regression assertions would reduce the final net saving.
   - **If we skip it:** The same delivery fallback remains independently maintained in two rendering branches.

**Rejected simplifications**

- **Removing the no-op scroll connector or its parameters.** `apps/web/src/platform/lib/lenis-scroll.ts:9–10` intentionally retains the public scroll interface after switching to native scrolling. `AppShellRoot.tsx:397` still expects its cleanup callback, and `components/app-shell/lenis-scroll.ts:1–7` re-exports it. Removing it would change a public interface and require edits outside this module. The app-shell tests also protect the absence of a Lenis instance and recurring frame work.
- **Replacing modal-lock tokens with one boolean, or removing the deletion guard.** `lenis-scroll.ts:13–19` supports overlapping surfaces and repeated cleanup. `components/app-shell/lenis-scroll.test.ts:74–82` and `styles/scroll-root-class-css.test.ts:41–65` exercise overlapping locks and idempotent release. The set and conditional synchronization have distinct regression value.
- **Dropping native scrolling fallbacks or simplifying alignment calculations.** Root versus window scrolling, centered panes, margins, root scroll padding, immediate navigation resets, and reduced motion have different observable outcomes. Consolidating the repeated element-target branch offers only a tiny reduction and leaves branches needing additional verification; it is not an actionable finding in this report.
- **Removing preview validation, activation gating, or asset readiness checks.** `private-preview.ts:13–20` validates bridge configuration; `:45–52` checks message origin, parent frame, context, and generation. The remaining code blocks navigation/submissions and waits for hydration, styles, visible images, and fonts. `scripts/test-preview-policy.mjs:18–32` and `:79–84` specifically exercise hidden responsive images, resizing during readiness, and offscreen lazy images. The stylesheet and image checks are supported by failure/retry scenarios, not merely speculative defense.
- **Collapsing static and hosted purchase readers or deleting the inline-data flag.** The static reader exports `inlinesPurchaseInformation = false`; hosted browser and server replacements export `true`. `apps/backend/astro.public.config.mjs:100–112` selects those replacements, and `apps/backend/test/scripts/public-build-config.test.ts:33–58` checks export compatibility and the flag. `SiteLayout.astro:122–128` uses the flag to decide whether browser data must be inlined. The constant assertion in the owned purchase test therefore protects a real build contract.
- **Removing public-image allowlists or either fallback stage.** `public-image-fallback.ts:7–18` excludes unrelated, private, credential-bearing, and unapproved sources. Lines 19–31 clear responsive candidates and first preserve a matching shared `src` transform before falling back to the original. The owned tests cover this two-stage sequence, retry avoidance, unrelated URLs, eager failures, and later capture events.
- **Replacing month tables with locale formatting, or sharing them through another module.** Availability formatting rejects malformed `YYYY-MM` values; preorder formatting slices already supplied dates and uses exact English wording. A formatter replacement has different edge behavior. Adding an import or helper solely to share a fixed twelve-name table does not provide a justified smaller change under the current closed boundaries.
- **Sorting shipping estimates or filtering withheld values.** `preorder-estimate.ts:80–88` returns `null` if any estimate is withheld and keeps the first estimate when sort keys tie. Its single pass is already linear. Sorting, filtering, or changing the comparison would risk order-level wording and identity behavior.
- **Replacing prose rendering with raw HTML or removing link/alignment checks.** The renderer preserves quote/list grouping, ordered-list starts, alignment, safe links, new-tab protection, and literal-text escaping. Its source and formatted-fixture tests establish behavior that a shorter renderer must retain.
- **Changing URL matching or routing all purchase links through another URL helper.** Navigation currently relies on Home special cases, substring matching, base stripping, and shared attributes. Purchase links use `import.meta.env.BASE_URL`, while site helpers prefer `astro:config/client` configuration. Their equivalence under every supported build has not been established. Neither a routing behavior fix nor a normalization redesign is authorized here.

**Inspected owned files**

All **14 source files** and **8 test files** under `apps/web/src/platform` were read completely. No nested module root was found. The generated schema referenced by the content fixture was excluded.

| Owned source group             | Files inspected                                                                                                                | Connected behavior inspected                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration and navigation   | `config/site.ts`, `utils/urls.ts`                                                                                              | Canonical and absolute URLs, Local base paths, external links, desktop header, mobile Menu, footer, shell routing and current-route checks                                               |
| Purchase rendering             | `components/Prose.tsx`, `components/PurchaseInformation.tsx`, `components/PurchaseDocument.tsx`, `lib/purchase-information.ts` | Store Item summary, checkout summary, terms/privacy routes, sitemap/footer privacy visibility, newsletter and form privacy links, static/hosted reader replacement                       |
| API configuration              | `lib/backend/api-client.ts`, `lib/backend/public-backend-config.ts`                                                            | Shared public factory, live checkout request composition, preview API origin, preorder showcase reads                                                                                    |
| Availability and preorder copy | `lib/availability-copy.ts`, `lib/preorder-estimate.ts`                                                                         | Listing chips, item purchase status/actions, release presentation, showcase, cart notice, cart/checkout lines, return-page copy                                                          |
| Images                         | `lib/editorial-image.ts`, `lib/public-image-fallback.ts`                                                                       | Responsive sizes, source-width caps, contain-frame ratios, Astro cards/detail/hero callers, gallery callers, initial and delegated image failures                                        |
| Scrolling and preview          | `lib/lenis-scroll.ts`, `lib/private-preview.ts`                                                                                | Shell navigation resets, target scrolling, overlapping modal locks, menu/cart/overlay consumers, preview URL propagation, private cart storage, player referrer policy, bridge readiness |

Owned tests inspected: `utils/urls.test.ts`; `lib/availability-copy.test.ts`; `lib/preorder-estimate.test.ts`; `lib/editorial-image.test.ts`; `lib/public-image-fallback.test.ts`; `lib/purchase-information.test.tsx`; `lib/backend/public-backend-config.test.ts`; and `lib/backend/api-client.test.ts`.

`project.json` and `content/purchase-information/site.json` were read as ownership and fixture context, bringing the tracked module inventory to **24 files**. Content edits remain excluded.

Connected test evidence included the app-shell scroll tests, scroll/CSS contract tests, shared API-client factory tests, checkout delivery-summary tests, hosted purchase-reader override tests, preview policy browser probe, and relevant Store Item/checkout e2e call sites. Consumer inspection focused on the behavior connected to this module; other modules were not independently audited in full.

The review applied the saved Ponytail review/coding guidance, repository and imported instructions, and relevant simplification, boundary, shell, image, preorder, checkout, and content-publication requirements. Expected load was one public browser document with bounded image ladders, listing records, and cart lines. No measured performance improvement is claimed.

**Graph and validation evidence**

- Both existing graphs were consulted before substantive investigation. Graphify queries used the requested **2,500-token budget**. Broad results were truncated or included unrelated vocabulary; targeted explanations resolved the relevant scroll, preview, purchase-rendering, backend-configuration, image-helper, and unused-wrapper relationships. One ambiguous purchase symbol was resolved using its full node ID. No conclusion depends on an omitted broad-graph edge or an inferred edge.
- CodeGraph returned current line-numbered source and caller relationships. Exact reads filled test-file coverage not returned by its file queries, and scoped repository searches established the unused wrapper’s reference set.
- `pnpm test web-platform` succeeded: **8 test files, 49 tests**. Nx reported **1/1 cache hits**. This is cached baseline evidence; the review did not record a fresh Vitest execution.
- No `pnpm validate`, browser acceptance, provider check, or hosted build was run. Full validation is deferred to the coordinating verification thread after implementations settle; this read-only review did not invoke formatting on the shared checkout.

**Source identity**

- Branch: `main`.
- HEAD: `3355c335226838f996efb5536f55271f819a3e14`.
- Module fingerprint, verified unchanged across the review and at the final check: `32e04d089ad30dc35d38159dae3d1f2311de0d3b130f83990b15d120da2bae4e`.
- Fingerprint method: use the ordered paths from `git ls-files -- apps/web/src/platform`; compute each file’s lowercase SHA-256 over its raw bytes; form `path + SPACE + hash` for each file; join with LF and no final LF; SHA-256 the UTF-8 manifest. This covers all 24 tracked files. No module diff or untracked module file was present at the final check.

| Finding file                         | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| `lib/backend/api-client.ts`          | `f872a8b147c2b683aa6d35a6f7a5070eaba697c1f019018f548f8710c5871b71` |
| `lib/backend/api-client.test.ts`     | `993dbc5d337f180350ad2877645853179efc52db33c8657dba00534bddd1909d` |
| `components/PurchaseInformation.tsx` | `f63831ea6ceb38cb9be36930aff3650f001158d8302f4712880634029f0efd51` |

Other modules changed concurrently, including shared-package files. The shared factory test was re-read after its change. The stable module fingerprint does not establish acceptance of the final combined checkout; the fresh implementer must recheck callers and retained coverage before editing.

Verdict: **Ship.** No behavior fix is required by this review. Findings **1 and 2** are supported cleanup candidates for the fresh implementation thread.

Lean: **approximately 34 lines removable**—18 production lines and 16 tests dedicated to the unused wrapper, before any additional retained assertions.

Not checked: fresh uncached tests, live browser/preview acceptance, hosted/provider behavior, and final combined-tree validation. Private-preview browser coverage was inspected but not executed.
