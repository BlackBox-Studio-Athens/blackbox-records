# Email application — received review

Reviewer thread: `01a12582-cc15-7a33-a1ad-3e8119934819`. Reviewer turn: `01a12582-d591-7d22-ba15-5edbc0dcb50e`.

Immutable source: `.codex-artifacts/simplification/22-email-application-review.result.json`; raw SHA-256 `bd3a5a4bd20bac9964b17016fbc6573d479171a8f6df81f1537646e8346e053b`. The complete received report follows verbatim; implementation decisions and current evidence belong to `../implementations/email-application.md`.

What this change does: This is a completed read-only review of Module 22/29, `email-application`, under `apps/backend/src/application/email`. The module builds commerce and inquiry emails, routes recipients, registers newsletter Contacts, and translates provider results into application outcomes. Four behavior-preserving simplifications are supported by current source and caller evidence; no repository files were changed.

**Source identity and review conditions**

- Checkout: `C:/Users/SVall/WebstormProjects/blackbox-records`, branch `main`.
- HEAD at start and completion: `3355c335226838f996efb5536f55271f819a3e14`.
- The owned module contains 18 source files, five test files, one snapshot file and `project.json`. All were inspected, with no nested module roots found.
- The 25-file module fingerprint was identical at `2026-10-10T11:15:08Z` and `2026-10-10T11:38:04Z`: `475597777c9b4e7c39438946e516004477a37000e037967db035ccecfd3860ee`.
- Scoped Git status was clean at both observations. No moving owned source was detected.
- Fingerprints use SHA-256 over sorted records of `relative-path + NUL + file-SHA256 + LF`.
- The module boundary is closed. Its public entrypoint is `index.ts`, its provider interface is `spi.ts`, and its declared dependency is `backend-platform`. The findings preserve those boundaries.

The review assumes the existing Worker workload: request-driven inquiries and newsletter registration, plus bounded commerce delivery processing. No concurrency, persistence, retry or provider-acceptance policy change is proposed.

**Should fix**

1. **Keep one implementation of HTML escaping**

   Locations: [templates.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/templates.ts:31), L31–38; [paid-order-templates.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/paid-order-templates.ts:513), L513–520; [services-inquiry.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/services-inquiry.ts:175), L175–182; [withdrawal-email.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/withdrawal-email.ts:31), L31–45.

   - **What this is:** Email HTML escapes visitor text, order facts, brand attributes and receipt content before inserting them into markup.
   - **Problem:** Three private functions contain the same five replacements. Withdrawal delivery implements the same conversion with a fourth, inline replacement table.
   - **Fix:** Export the existing `escapeHtml` function from `templates.ts` for use inside this module. Import it in the other three files, delete the two copied functions, and replace withdrawal’s inline replacement with `const escaped = escapeHtml(text)`.
   - **If we skip it:** Four implementations of the same security-sensitive conversion remain to be maintained together.

   **Proof:** All three functions replace `&`, `<`, `>`, double quotes and apostrophes with exactly `&amp;`, `&lt;`, `&gt;`, `&quot;` and `&#39;`, in that order. Withdrawal uses the same character-to-entity mapping. Its single-pass replacement is equivalent to the existing helper because the helper handles original ampersands first and never revisits ampersands introduced by later replacements.

   The affected callers are concrete: the outer template escapes its preheader and stylesheet URL; paid-order renderers escape facts, attributes and warnings; the inquiry renderer escapes labels, values and message text; withdrawal delivery escapes the completed plain-text receipt. Availability and estimate emails already reach the paid-order rendering helpers. The withdrawal caller in `orders/order-withdrawal.ts`, L62–67, supplies the retained declaration to this email boundary.

   **Preserve:** Keep every escape at its present insertion point, preserve plain text, and retain the withdrawal comment explaining that visitor fields do not control headers, links or recipients. Keep `index.ts` unchanged; the shared helper needs no new public module entrypoint.

   **Coverage to retain:** Inquiry escaping at `services-inquiry.test.ts`, L178–194; paid-order text and attribute escaping at `paid-order-email.test.ts`, L447–471; estimate escaping at L339–354; availability escaping and base-path handling at `availability-alert-email.test.ts`, L54–61; withdrawal escaping and declaration preservation at `orders/order-withdrawal.test.ts`, L46–67. Retain the complete preview snapshot.

   **Focused checks:** `pnpm test email-application` and `pnpm test apps/backend/src/application/commerce/orders/order-withdrawal.test.ts`. Snapshot content must remain unchanged.

   **Expected reduction:** Approximately 21 source lines, with four escaping implementations reduced to one. No test deletion is justified.

2. **Reuse the existing recipient-routing decision for newsletter Contacts**

   Location: [routing.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/routing.ts:3), L3–39.

   - **What this is:** Transactional email and newsletter registration both redirect intended addresses to the managed sink when the Product Environment profile uses UAT sink delivery.
   - **Problem:** `routeTransactionalEmailRecipient` and `routeNewsletterContact` repeat the identical policy-and-override condition. Their differences are the names of the returned fields.
   - **Fix:** Keep the transactional router and have the newsletter router translate its result into the existing newsletter shape.
   - **If we skip it:** Two separate copies of one environment-routing rule remain.

   The newsletter body can become:

   ```ts
   const recipient = routeTransactionalEmailRecipient(config, intendedSubscriberEmail);
   return {
     contactEmail: recipient.to,
     intendedSubscriberEmail,
     isSinkRouted: recipient.isSinkRouted,
   };
   ```

   **Proof:** Both functions accept the same configuration projection and use exactly `emailDeliveryPolicy === 'uat-sink' && uatRecipientOverrideEmail`. Both otherwise return the intended address and `isSinkRouted: false`. The proposed translation preserves newsletter property names, values and ordering.

   `registerNewsletterContact` is the newsletter router’s application caller at `newsletter-registration.ts`, L21–35. It uses `contactEmail` for the provider write and adds intended-subscriber evidence only when sink routing occurred. Its connected callers are the public newsletter service, L27–32, and paid-order delivery, L69–78. Both must continue to receive the existing result shape.

   **Preserve:** Retain the truthy override condition in the existing router. Keep runtime sink validation, PRD override suppression, consent evidence, caller properties and the provider call unchanged. Do not merge the distinct routing result types.

   **Coverage to retain:** Transactional direct/sink routing at `email-application.test.ts`, L94–106; newsletter sink evidence at L192–226; direct registration without synthetic evidence at L228–252; checkout newsletter delivery at `orders/paid-order-delivery.test.ts`, L87–117. Existing PRD inquiry and paid-order tests also protect the shared transactional routing policy.

   **Focused checks:** `pnpm test email-application` and `pnpm test apps/backend/src/application/commerce/orders/paid-order-delivery.test.ts`.

   **Expected reduction:** Approximately seven source lines and one duplicated conditional. Reuse introduces one short-lived routing result object; this is a maintenance simplification, with no speed claim.

**Nice to have**

3. **Remove private rendering settings that have no effect**

   Locations: [paid-order-templates.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/paid-order-templates.ts:137), L137, L342–359, and palette entries at L25 and L35.

   - **What this is:** The ops item renderer passes an `includeVariant` option through two private helpers. The same file holds a private palette used by email markup.
   - **Problem:** The option’s only caller always passes `true`, so its false branch is unreachable. Palette properties `accent` and `textSubtle` are never read.
   - **Fix:** Remove the option argument and both private option parameters; always retain the current `Variant: …` metadata. Delete only the two unused palette entries.
   - **If we skip it:** Each ops render continues to allocate and forward an option object for a decision that never varies, and the palette retains two unused values.

   **Proof:** Graphify and CodeGraph identify `buildPaidOrderOpsEmail` as the only caller of `renderLineItemSummary`, at L137. That call supplies `{ includeVariant: true }`; `renderLineItemSummary` is the sole caller of `renderLineItemRow`, forwarding that option at L346. Neither helper is exported.

   A bounded source scan found 53 references to `emailDesignTokens`: its declaration and 52 direct property reads. There are no computed property reads or whole-object uses. Neither `accent` nor `textSubtle` appears among the accessed properties. The separately used `accentMuted`, `warningBorder`, and other palette entries must remain.

   **Preserve:** Keep item metadata order, separators, optional-label filtering, variant text, image/no-image markup, image alt text and preorder copy exactly as they are. Do not change shopper item rendering or any used color.

   **Coverage to retain:** The `ops-ready` and `ops-preorder` HTML in the preview snapshot includes the variant metadata. The snapshot test at `paid-order-email.test.ts`, L227–275, protects both. Retain the connected paid-order delivery tests, which exercise the normal persisted-order path with no product image.

   **Focused checks:** `pnpm test email-application` and `pnpm test apps/backend/src/application/commerce/orders/paid-order-delivery.test.ts`. No snapshot update is expected.

   **Expected reduction:** Approximately five source lines, two unused palette properties, one option allocation and one unreachable branch. Public interfaces remain unchanged.

4. **Build the ops monetary breakdown once and reuse its formatter**

   Locations: [paid-order-templates.ts](C:/Users/SVall/WebstormProjects/blackbox-records/apps/backend/src/application/email/paid-order-templates.ts:138), L138, L166 and L456–478.

   - **What this is:** `monetaryRows` formats the immutable merchandise, delivery and VAT breakdown for an ops email’s HTML and plain text.
   - **Problem:** A complete breakdown is built three times: for the HTML condition, the HTML table and plain text. Each build creates a new `Intl.NumberFormat` for each of its three amounts.
   - **Fix:** Compute one local `money` array and reuse it for the condition, HTML and text. Inside `monetaryRows`, construct one formatter after the existing eligibility guard and use it for all three amounts.
   - **If we skip it:** Each complete ops email builds the same three rows three times and constructs nine equivalent currency formatters.

   **Proof:** The calls are visible together in one synchronous template build. `monetaryRows` only reads the supplied order and formats its saved values; it does not mutate state or perform external work. The normal caller constructs a plain email input from persisted paid-order facts in `orders/paid-order-delivery.ts`, L86–124. The shopper builder already uses the same local-array pattern at L68, L77 and L90.

   **Preserve:** Leave the missing-breakdown guard before formatter construction. Keep `en-IE`, fixed `EUR`, division by 100, row order, parcel labels and VAT wording. Keep `formatTotalPaid` and the shopper formatter’s separate locale/currency behavior unchanged. Do not infer missing money or default it to zero.

   **Coverage to retain:** Manual delivery labeling at `paid-order-email.test.ts`, L34–53; zero VAT collection at L54–75; inclusive breakdown at L76–101; historical missing amounts and zero delivery at L356–382; and the complete preview snapshot.

   **Focused check:** `pnpm test email-application`. Verify both a complete breakdown and the existing omitted-breakdown path without changing snapshots.

   **Expected reduction:** Complete ops emails would build one breakdown instead of three and construct one breakdown formatter instead of nine. This adds approximately one local source line overall. These are source-proven operation counts; elapsed-time or Worker CPU savings were not measured.

**Rejected simplifications and contracts to retain**

- **Do not merge shopper and ops frames or replace inquiry markup with a different frame.** Their dimensions, styles, content and accessibility attributes differ. Sharing additional markup would require proving complete HTML equivalence and would add scope beyond these findings.
- **Do not remove runtime configuration validation or the preliminary binding schema.** Configuration enters through a trust boundary. The preliminary schema also contributes the exported input type used by bindings with optional configuration fields. Sink and brand-profile checks enforce separate constraints.
- **Do not remove email validation from generic delivery or newsletter registration.** These are exported application operations with callers beyond the inquiry validator. Preserve validation timing and rejection before provider work.
- **Do not collapse tag sanitization generically.** It is not idempotent after truncation. For example, sanitizing a value of 255 `a` characters followed by `-b` leaves a trailing hyphen after the first truncation; a second pass removes it. Removing an existing pass can change emitted tags.
- **Do not remove provider-safe fallbacks or optional-result handling by changing result types.** Those fields are optional in the current exported contracts. Tightening those interfaces is outside this review’s behavior-preserving scope.
- **Do not parallelize shopper and ops sends.** `sendPaidOrderEmailNotifications`, L32–36, intentionally sends shopper first and passes its outcome into ops warning content. Existing tests protect that ordering and continued ops delivery after a classified shopper failure.
- **Do not remove preview fixtures, snapshots or exported input fields because one renderer does not use them.** The preview exporter consumes the fixture builder, and the seven snapshot variants protect distinct output. Compatibility does not depend solely on one renderer’s current field reads.
- **No test deletion has sufficient proof.** Validation limits, alias routing, content order, escaping, immutable facts, missing money, estimate wording, retry identity, failures and privacy each have useful regression coverage.

**Inspected scope**

All file names in the first three rows are relative to `apps/backend/src/application/email`.

| Area                                         | Files inspected                                                                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Configuration, contracts and common delivery | `config.ts`, `errors.ts`, `idempotency.ts`, `index.ts`, `routing.ts`, `spi.ts`, `templates.ts`, `transactional-email.ts`, `types.ts`                                                            |
| Newsletter and inquiry                       | `newsletter-registration.ts`, `services-inquiry.ts`                                                                                                                                             |
| Commerce content and previews                | `availability-alert-email.ts`, `paid-order-email.ts`, `paid-order-templates.ts`, `paid-order-email-previews.ts`, `preorder-estimate-email.ts`, `ship-estimate-format.ts`, `withdrawal-email.ts` |
| Every owned test                             | `email-application.test.ts`, `services-inquiry.test.ts`, `paid-order-email.test.ts`, `availability-alert-email.test.ts`, `ship-estimate-format.test.ts`                                         |
| Ownership and output baseline                | `project.json`, complete `__snapshots__/paid-order-email.test.ts.snap`                                                                                                                          |
| Connected orders callers                     | `paid-order-delivery.ts`, `order-withdrawal.ts`, `availability-alert-delivery.ts`, `preorder-estimate-notice.ts` under `apps/backend/src/application/commerce/orders`                           |
| Connected HTTP callers                       | `public-newsletter-services.ts`, `public-services-inquiry-services.ts` under `apps/backend/src/interfaces/http/routes`                                                                          |
| Provider and profile dependencies            | `apps/backend/src/infrastructure/resend/email-runtime-services.ts`, `resend-email-gateway.ts`, and `apps/backend/src/platform/env.ts`                                                           |
| Preview consumer                             | `scripts/render-paid-order-email-previews.ts`, inspected without execution                                                                                                                      |
| Connected regression tests                   | Complete `orders/order-withdrawal.test.ts`, `orders/paid-order-delivery.test.ts`, and `interfaces/http/email-runtime-services.worker.test.ts`                                                   |

The ten connected source files listed above had completion fingerprint `7165a99887bf5f3b5ebdc033ad294f9dff9e81854e651bd33593b3e5fa7d962c`. This is a completion identity; a start fingerprint for those external files was not recorded. They were read from current source and were not locked against concurrent work.

The review read the required personal and repository instructions, both archived Ponytail skills, workflow/reference documents, the simplification proposal/design, and the relevant simplification, newsletter, Services inquiry, paid-delivery, preorder, environment, boundary and project-language requirements. Relevant commerce operations and checkout acceptance sections were also checked. Cloudflare and Workers guidance was loaded, including the current official guidance on awaiting required work and request-scoped state. [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).

**Graph and evidence limitations**

Graphify queried the existing graph with the 2,500-token budget. The initial query was truncated; targeted `explain` calls and bounded adjacency reads resolved the relevant email relationships. No graph was initialized, rebuilt, enriched or saved.

CodeGraph supplied current source and caller relationships. Some test callbacks and the barrel exports were omitted despite a completeness label; bounded exact reads filled those gaps. Elided template sections were also read exactly. Unrelated staff/generated neighbors were excluded from the review. No unresolved owned-source gap remains.

**Verification handoff**

This review executed no tests, formatter, build, preview generator, browser scenario, provider operation or repository validation. The focused commands above are recommendations for the implementer and verification owner, not passing evidence. The persistent verification thread retains ownership of shared validation, graph refreshes and OpenSpec task updates.

Retain all existing tests and snapshots. Any selected implementation should preserve complete message HTML/text, recipient and reply addresses, tag order, idempotency keys, provider-call order, failure outcomes, logging privacy and caller-owned persistence. Repository completion still requires the verification thread’s source-bound checks on the resulting tree.

Verdict: Ship. The current behavior can be retained while implementing the four supported internal simplifications with their focused checks.

Lean: approximately 30 source lines removable overall, with no test deletions.

Not checked: runtime test results, rendered email-client behavior and hosted/provider delivery; this read-only report does not establish implementation or release acceptance.
