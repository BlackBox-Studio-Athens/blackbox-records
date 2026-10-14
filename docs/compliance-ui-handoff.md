# Compliance UI handover for Claude Desktop

Owner: the coordinating Codex chat, **Audit site GDPR compliance**. Updated 14 October 2026.

The four Codex preparation packages and Claude's implementation are integrated into `main`. Codex has accepted the corrections to review findings R1-R4, as recorded below. This is not publication approval, release approval or a declaration of legal compliance. Each linked OpenSpec change remains the source of requirements, tasks and acceptance evidence.

## Claude implementation review, 14 October 2026

Claude's implementation is committed on main as `b38f0a0cba0a4821fcde607ffb01bc74aaf14c04`, `8a5782020afa550b89ab89adfcb3ec8bd70d2f31` and `f4b6c5b523a024e637cd61f77b25476e4cdb547e`. The first review found four regressions. Fix commits `17547f01` and `c8251ce2594db5e1cbe6fd4748cfa9a5b3d46217`, with evidence commit `a4cd20f7d11320cea5ac98fa804cbd26b6ca0203`, were subsequently reviewed and **R1-R4 are closed for local code review**. See the [GPSR review](../openspec/changes/record-gpsr-product-safety/claude-review.md) and [consent review](../openspec/changes/secure-consent-withdrawal-and-newsletter-verification/claude-review.md) for the historical findings, fixes and latest Codex acceptance.

Codex independently verified the passing clean-source validation summary for `a4cd20f7`, reviewed the new regression tests and connected code, and reran the desktop Manage alerts regression. An additional Chromium touch-emulation check at 390px passed: a new tab opens with no opener, while the original document, same player iframe and cart remain intact. Visible layout, styles and copy remain unchanged; the new-tab notice is screen-reader-only. Actual device/WebKit and assistive-technology checks are not implied. Owner facts, Local publication, remaining accessibility/staff browser checks and hosted acceptance remain open.

The correction prompt has been completed. Do not rerun the original implementation prompt below or reopen R1-R4 without new evidence. Remaining acceptance is listed in the owning OpenSpec tasks; this review does not authorize deployment or publication.

## Ownership and approval

Claude Desktop owns all public/staff UI changes, including rendered copy. Codex owns backend/data preparation and integration review. No Claude CLI is required.

Before any non-text change on a main screen, show the owner a concrete desktop/phone preview and wait for explicit approval. Follow AGENTS.md, its imports and the Impeccable gates. Reuse the existing visual language, components, persistent player and publication workflow.

Work on `main` in `C:/Users/SVall/WebstormProjects/blackbox-records`. Preserve unrelated changes and commit only the agreed work. Do not implement in the former Codex worktrees, push, deploy, publish CMS content, send real email, or change provider settings. If Claude Desktop cannot access the repository, explain that limitation and ask the owner to attach the named handovers; do not claim files were edited or checks ran.

## Reviewed packages

| Audit items | OpenSpec and detailed handover                                                                                    | Remaining work                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 2, 5, 10    | [Privacy and Holding access](../openspec/changes/clarify-privacy-and-holding-access/handover.md)                  | Owner-confirmed privacy copy, CMS review/publication and hosted routing acceptance                  |
| 3, 4        | [Consent and cancellation](../openspec/changes/secure-consent-withdrawal-and-newsletter-verification/handover.md) | Remaining accessibility/provider checks, hosted headers and reviewed privacy amendment              |
| 8           | [Legal-guarantee notice](../openspec/changes/add-harmonised-legal-guarantee-notice/handover.md)                   | Remaining zoom, no-JS, image-failure and hosted acceptance                                          |
| 9           | [GPSR product information](../openspec/changes/record-gpsr-product-safety/handover.md)                            | Verified supplier facts, incomplete-offer decision, staff/public browser and publication acceptance |

Accepted source commits and their integration on main:

- Privacy: `6ad7de5a399538fae810092434d09c1a4f0656e8` → `e935c6fd07926eafce65d6532c85ea6c4c449fe4`.
- Consent: `09db6a4e59f15944f1f8341df2231b2b39120a21` → `06a01797f32fa796f014114c7612ccb78d14432b`.
- Guarantee: `57cf66e6f1228ad6690b68aade33b833c2a9bdde`, unchanged by integration.
- GPSR: `eb1925e8390bf196d9ff003ce03b13920ef34fcf` → `f6e60fc984aa3bcf25a31f070702fc4ed69bedf9`.

Parent review covered the connected backend flows and tests, the two-token cancellation race, preservation of unsubscribe preferences, privacy routing/cache inputs, private GPSR evidence projection and Greek guarantee-notice evidence. The consolidated validation receipt and source summaries are retained in `.codex-artifacts/compliance-review-20261014/`; read `final.json` for the actual combined-tree result. Local checks do not establish browser, provider, publication or hosted acceptance.

## Contracts and integration order

### Consent and preferences

Use the generated `@blackbox/api-client/public` client and the environment's existing backend base URL. The detailed handover defines request/response/error states and exact edit points.

- Existing newsletter registration returns `{status:"registered", confirmationRequired:true}`. This means a confirmation request was accepted, not that the address is subscribed. Replace the current immediate-subscription success copy in both signup surfaces.
- `POST /api/newsletter/confirmations` accepts `{token}`. Confirmation is explicit and single-use; existing global unsubscribe/suppression preferences remain respected.
- `POST /api/availability-alerts/withdrawal-links` accepts `{email}` and returns a generic response independent of membership.
- `POST /api/availability-alerts/withdrawals` accepts `{token}`. Valid tokens cancel all pending alerts for the address and invalidate its existing management capabilities. Unknown, expired and used tokens receive the same response, so the UI must not falsely guarantee their cancellation.
- Add the `email-preferences/` route used by the backend's email links. Read tokens from the fragment, remove the fragment before third-party code can see it, keep tokens only in memory, and require an explicit button action. No mutation on GET. Follow the handover's no-store/no-referrer/noindex and accessibility requirements.
- An email already being processed can still arrive if cancellation occurs after the last lease check. Deleted requests cannot be recreated by stale delivery work. Explain that limit without promising recall.
- Tokens expire after 24 hours for newsletter confirmation and at most twelve months for alert management; deletion happens on a successful maintenance pass. The shared twenty-link daily cap and one-hour cooldown are operational policies, not statutory periods.

Migration `0036_email_consent_capabilities.sql` belongs to the existing commerce D1 migration path. GPSR adds no competing SQL migration. Do not deploy the consent backend by itself: until Claude adds the preferences route and updates copy, the new links and displayed signup result are incomplete.

### Privacy and Holding

Prepare changes against the actual accepted `purchase_information` record. Preserve the real controller details and unrelated terms. `apps/web/src/platform/content/purchase-information/site.json` is a pending source fixture, not proof of live content.

Combine the privacy handover's retention/provider text with the consent handover's final cancellation and cleanup behavior. Keep operational criteria and unverified owner facts distinct; do not invent fixed legal retention periods or claim cleanup at the exact expiry instant.

The Holding build has four exact temporary 302 redirects for `/privacy`, `/privacy/`, `/terms` and `/terms/`. Their destination is the full legal page on `pages.dev`, including its shop navigation. Show that navigation consequence in the Holding-link preview. Before a separately authorized Holding deployment or rollback, reconcile the destination with switch-day retirement of the technical hostname to avoid a redirect loop. This is not a standalone same-origin Holding notice. Keep wildcard/shop-route isolation and its regression intact.

### Guarantee notice

No new API, database field, consent checkbox or checkout rule is required. Use the official unmodified RGB notice, with the complete accessible text and Greek/English access described in the [legal research](../openspec/changes/add-harmonised-legal-guarantee-notice/legal-research.md). Record exact asset filenames, provenance and hashes. The proposed Store/checkout reminder is a proposal for preview, not an approved layout. Do not display GARAN without qualifying producer-guarantee evidence.

### GPSR

Release/Distro data supports optional private `product_safety` records. Public collection data exposes only verified product identification, manufacturer contacts, any required EU responsible person and the safety assessment. Private evidence, review metadata, operator role and first-market date must not appear in HTML or client props.

Use the existing staff save/review/publication path. Do not send the public projection through the private evidence validator. Cover product pages and buying paths that bypass them; a product-page-only or JSON-LD-only disclosure is insufficient for this plan.

No actual manufacturer details were populated and no catalogue-wide sale gate was added. The owner's statement that existing own releases were dunk-pressed is context, not proof that dunk is every product's legal manufacturer. Unknown distro facts remain unknown. Preserve incomplete drafts and do not silently choose how incomplete offers are sold or withheld.

## Owner facts and excluded work

Before publishing factual/legal copy, establish:

- Actual retention review practice, applicable record-keeping periods and starting events, mailbox/provider settings, agreements/transfer evidence and the analytics assessment.
- Each physical edition's legal economic-operator roles, verified manufacturer/responsible-person contacts, product identifiers and safety information, plus the treatment of incomplete offers. Use the GPSR handover's supplier questions; do not contact suppliers without authorization.

The owner intentionally plans a small natural-person launch, accepts the risk and plans a later company with appropriate KAD and replacement Stripe account. Preserve the current VAT, checkout and launch configuration. Risk acceptance is not evidence of a legal exemption.

Item 6 remains unchanged. Item 7 is [add-company-order-contract-confirmation](../openspec/changes/add-company-order-contract-confirmation/proposal.md), with five unstarted tasks. Do not implement it until the company is operational and the owner requests implementation.

## Claude acceptance

After approval, implement the agreed UI and land focused checks with each changed flow. Verify keyboard/focus/live regions, no token leakage, error and expired-link paths, 320/390px layout, no-JS guarantee access, privacy of drafts/evidence and persistent player/cart continuity where affected. Use scoped `pnpm test` and browser commands from `docs/agent-workflow.md`, then `pnpm validate`; do not bypass the feedback policy.

Record the approved preview, source identity, checks and remaining acceptance in each owning OpenSpec change. Return changed files, commit identity, evidence paths and remaining facts for Codex review. Keep CMS Content Publication and Software Release separate. Complete UI work before requesting release of the combined backend/UI behavior.

## Original implementation prompt for Claude Desktop (historical; completed)

```text
Work in C:\Users\SVall\WebstormProjects\blackbox-records on main. Read AGENTS.md and docs/compliance-ui-handoff.md, then all four detailed OpenSpec handovers it links. Codex has prepared and reviewed the backend/data contracts; you own all UI and rendered-copy changes.

Start with one coordinated proposal containing exact copy and concrete desktop/phone previews. Before any non-text UI change on a main screen, show me the preview and wait for my explicit approval. This prompt is not design approval. Follow the reviewed contracts and keep unknown owner/supplier facts explicit.

After approval, implement the approved UI, run the relevant repository checks, and update the owning OpenSpec tasks/evidence. Preserve the current tax, checkout and launch settings. Leave item 6 and the deferred company-order-confirmation change (item 7) alone. Do not push, deploy, publish CMS content, send real emails or contact third parties. Return a review-ready handover to Codex.

If you cannot access the repository from Claude Desktop, say so and ask me to attach the named handover documents. Do not claim to have edited or tested files you cannot access.
```
