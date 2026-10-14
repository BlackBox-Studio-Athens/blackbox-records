# Claude Desktop handover: privacy, retention and Holding access

## Ownership and delivered backend change

The user assigns **all rendered UI, including text, to Claude Desktop**. Codex changed no Astro/React UI, CSS or CMS entry. Non-text main-screen changes need a concrete preview and explicit owner approval before implementation. Do not infer approval from this handover. Scope: audit findings 2, 5 and 10 only. Consent findings 3/4 have a sibling owner; guarantee/GPSR have separate owners. Parent owns the future company-transition OpenSpec.

The local routing patch adds four exact 302 entries to `dist-holding/_redirects`: `/privacy`, `/privacy/`, `/terms`, `/terms/` point to the corresponding current notices on `https://blackbox-records-web.pages.dev`. No wildcard, shop route, index HTML, 404 HTML, DNS, checkout, launch flag, provider setting or workflow was changed. The checker rejects extra redirects and shop HTML. This is prepared source, **not deployed behavior**.

The destination is the existing full-site legal page, with its existing navigation. Thus a visitor following that document's navigation can reach the already-public technical shop. The apex itself keeps Holding/404 isolation. Do not present this as a same-origin standalone Holding notice. If the owner wants that different experience, return to the parent for a separate coherent implementation; do not copy stale fixture policy text or broadly proxy the shop.

`launch-switch-day` owns eventual Holding retirement. Its finalization may redirect `pages.dev` to the apex; retiring or refreshing these redirects before a later Holding rollback is necessary to avoid a legal-URL loop.

## Actual evidence and exact edit points

A bounded unauthenticated read on 14 October 2026 returned the actual PRD `/privacy/` document, updated **2026-10-13**. It already contains controller identity/address, `orders@blackboxrecordsathens.com`, contract/legal-obligation/security purposes, optional newsletter/availability consent, online withdrawal, Resend US/SCC wording, other-provider terms, browser cart behavior, 12-month availability cleanup and GDPR rights/complaint wording. Preserve these real details. The owner confirms a natural-person launch and no business commencement; do not turn the notice into an invented incorporated-company identity or change VAT/checkout/launch controls.

- Editorial authority: `purchase_information` singleton, fields `content.privacy.{purposes,recipients,retention,rights,contact}.{summary,paragraphs}` and `content.revision`. Preserve `seller`, all `terms`, and unrelated privacy paragraphs. Confirm exact paths against the current native editor entry, since saved revisions and accepted content can differ.
- Contract: `packages/content-model/src/purchase-information-schema.ts`. Sections hold one prose summary and a nonempty prose paragraph array. No schema/API change is needed for this copy. Do not replace `apps/web/src/platform/content/purchase-information/site.json`: it is a **pending static fixture**, not the real CMS entry.
- Legal route: `apps/web/src/pages/privacy/[...page].astro`; reader: `apps/web/src/platform/lib/purchase-information.ts`; presentation: `apps/web/src/platform/components/PurchaseDocument.tsx`. Existing paragraph layout is sufficient. Preserve document headings, anchor IDs, normal navigation and persistent player behavior.
- New discoverability link, Claude only: `apps/web/src/pages/prd-holding/index.astro`, existing `.holding-page__actions` region. Preview a restrained **Privacy information** link to `/privacy/` at desktop and 390px before implementation. A Terms link is optional UI scope; the routing exception is already prepared for saved policy URLs. Do not add an embed, consent banner, form, analytics script or shop navigation to Holding.
- If a relative legal anchor is added, update `apps/web/scripts/check-prd-holding.ts`'s action validation narrowly: permit only `/privacy/` and, if approved, `/terms/`. Its current loop allows only `https:`/`mailto:` anchors. Also reconcile the `PRD Holding Page actions are real and static` baseline requirement, which currently describes only social/contact actions. Preserve the exact `_redirects` validator.

Use EmDash's existing saved-revision review, accepted baseline comparison, preview and publication path in `docs/content-publication.md`. This task authorizes preparation only; **no live save/publication, push, deploy or real email**. Review the exact entry against its current accepted snapshot and avoid dragging unrelated terms drafts into the selected revision.

## Proposed narrow CMS copy

These are **draft paragraphs**, not a statement that the operator has adopted unverified practices. Owner confirmations below must precede publication. Keep the current live paragraphs outside the specified replacements. Update revision to the actual accepted editorial date, not a manufactured publication date. Align summaries with paragraphs; summaries are not a substitute for the full notice.

### Purposes: replace only the Cloudflare analytics paragraph

> We use Cloudflare Web Analytics to understand which pages are read and how the site performs. It uses a browser performance beacon without analytics cookies or individual visitor profiles; we see aggregate page, referring-site, country and device figures. Where this processing involves personal data, our proposed basis is our legitimate interest in measuring readership and improving a reliable website, balanced against visitors' privacy. This is separate from processing necessary to deliver and secure the site and from optional music or video services.

**Before publishing:** remove the word “proposed” only after the owner adopts and documents the legitimate-interest assessment and checks the actual beacon/terminal-access behavior. Cookie-free does not itself establish an exemption under Greek electronic-communications law. Do not silently convert this into consent-based analytics without implementation. If that assessment requires a different basis or consent gate, parent must scope it separately. The existing analytics paragraph should stay live until a truthful replacement is accepted.

### Recipients: preserve existing Resend paragraph; clarify other providers

> Cloudflare hosts and protects the website and backend on our behalf. Its customer Data Processing Addendum describes transfers outside the EEA and incorporates EU standard contractual clauses for restricted transfers. An Eastern Europe location hint in our renderer is a placement preference, not a guarantee that all processing stays in Europe. Read https://www.cloudflare.com/cloudflare-customer-dpa/ and contact orders@blackboxrecordsathens.com for the safeguards applicable to your data.

> Stripe processes payments on our behalf and also determines its own processing for purposes such as fraud prevention, payment-network requirements and legal duties. Its Data Processing Agreement and Data Transfers Addendum describe these roles and international transfers, including processing in the United States: https://stripe.com/legal/dpa and https://stripe.com/legal/dta. Stripe's own-controller processing is described at https://stripe.com/privacy. We do not promise EEA-only processing by our providers.

**Before publishing:** confirm the relevant account agreements and transfer assessment. Public terms establish the provider mechanisms, not evidence of this owner's acceptance or effective application. Retain the existing offer to obtain relevant safeguards by email. Preserve BOX NOW/manual fulfillment and existing operator disclosures; do not invent the carrier's contractual role or an accountant recipient. Provider account/usage processing may have its own controller purposes. The consent sibling must supply final embed behavior wording; do not claim a withdrawal control exists until it works.

### Retention: keep browser-cart paragraph; replace the combined catchall

Suggested `retention.summary`: “Retention depends on the record's purpose, outstanding work and applicable duties. Browser cart storage and availability requests have the separate rules below.”

> Order, payment-reference and delivery records are needed while payment, fulfillment, a return or a refund remains open. Afterwards, any retained record must be tied to an applicable record-keeping duty or to establishing, exercising or defending a specific claim. The applicable legal retention period and its starting event depend on the type of record; we assess them separately rather than applying one period to every contact detail.

> Withdrawal declarations, returns and purchase-support correspondence are assessed when the case closes. Information still needed to evidence the declaration, meet an applicable duty or resolve an outstanding complaint or claim is retained for that purpose. A legal hold may postpone erasure of relevant material; unrelated correspondence must be assessed separately.

> Service inquiries that do not lead to work are assessed when the requested discussion ends. If work proceeds, the relevant correspondence follows the resulting contract and record obligations. Any further retention needs a specific unresolved complaint, claim or other documented reason; an inquiry alone is not newsletter consent.

> Newsletter contact data is used while the subscription remains active. After consent is withdrawn, sending must stop; only the evidence necessary to record consent, honour the withdrawal and avoid re-subscribing you should be kept for those purposes. The email provider's contact list, consent properties and suppression records need separate review from its sent-message logs.

> Technical and security logs are assessed against their need for failure diagnosis, abuse prevention or an active incident. Analytics reports follow Cloudflare's dataset retention: its documentation currently describes seven days of unsampled Web Analytics data followed by sampled storage, with reports available for the previous six months. Access to a report is not a guarantee that every underlying provider record is erased at that time. Provider logs, sent emails and our own mailboxes can have different retention rules.

> These criteria do not describe a general automatic deletion job for orders or correspondence. Contact orders@blackboxrecordsathens.com about a record or an erasure request. We assess the purpose, remaining work, applicable legal duties and any relevant legal hold before deciding what can be erased.

**Before publishing:** owner must adopt the actual review points/practice; accountant must identify any applicable statutory record categories, period and start event. Do not substitute a universal invented five-/ten-year number. These are privacy-publication gaps only, not new conditions on the owner's accepted launch/tax choices. Preserve accounting and legal-hold material; do not implement a bulk delete from this handover.

Availability paragraph refinement, source-backed: “Our backend removes a one-off availability request after a successful send or its final failed delivery attempt. Requests older than 12 months are removed on a successful scheduled cleanup run; a send already in progress keeps its active lease until it is safe to remove. Email-provider delivery records have their own retention.” Do not promise deletion at the exact anniversary or after cancellation before the sibling supplies that implementation. Check the final sibling behavior before integrating this paragraph.

## Backend facts and integration contracts

- `availability-alerts.ts`: 12 months, five attempts, ten-minute lease; `availabilityAlertExpiryCutoff` uses UTC calendar-month subtraction. `d1-availability-alert-repository.ts` deletes expired pending/released-lease requests and exhausted expired leases. `availability-alert-delivery.ts` deletes successful/final failed requests. `run-paid-order-delivery-schedule.ts` passes zero send limit when PRD alert sending is suppressed, while still expiring old requests. Earlier email/runtime failures can prevent a run reaching cleanup. No hosted cleanup execution was verified here.
- `store-cart.ts`: keys `blackbox.storeCart.v2` and legacy v1, no TTL; empty cart removes both keys. Browser failures are tolerated. No payment-card storage in this cart contract.
- `resend-email-gateway.ts`: newsletter contact registration writes consent properties plus topic/optional segment; transactional inquiry/order/availability mail uses the Emails API. No general contact/mailbox erasure workflow was established in this review. Resend documents 30-day email/log retention on Free/Pro/Scale, but that does **not** establish deletion of newsletter contacts or the operator's received mailbox. Confirm actual plan/settings before putting a provider duration in public copy.
- Internal analytics route `register-internal-analytics-routes.ts` returns aggregate daily counts and path/referrer/country/device breakdowns for 7d/30d; it is a protected staff read, not a visitor-rights endpoint. No individual browsing-history export is implied.
- Consent integration: merge/review the sibling's actual cancellation and newsletter-ownership contracts first. Use its verified success, invalid-token, already-cancelled, failure and retry states where applicable; no invented endpoint or “immediate erasure” promise. Pending manual email rights remain available via the published privacy contact.

## UI states, accessibility and acceptance

1. Holding link is an ordinary keyboard-focusable anchor with descriptive text, visible focus, adequate target and natural wrapping at 320/390px; no modal, client fetch, loading spinner or silent popup. Before following it, Holding still makes no page-owned third-party requests. The cross-origin transition is ordinary navigation; the full site's player continuity rules apply only within the full shell.
2. Destination is the current accepted privacy document, readable with JavaScript off. A pending CMS draft must never replace the current accepted document. Preserve its rights/contact and accessible section links. On provider outage do not show fixture text as a successful legal notice; report an unavailable destination during acceptance.
3. Test new Holding anchor permissions narrowly, artifact exact redirects, guessed `/store/`, `/store/checkout/`, `/artists/`, `/releases/` and `/api/*` isolation, and both legal slash forms. Actual status/query/host redirect behavior needs separately authorized Cloudflare acceptance. Local regression verifies the artifact contract, not live HTTP behavior.
4. For shared legal-page UI changes run the existing purchase-information/shell checks and focused route/player tests. Check 390px keyboard/overflow and no-JS document access. Rendered-copy-only CMS edits need accepted-revision comparison and snapshot readback; a source commit is not publication evidence.
5. Do not claim this change fixes overall GDPR/Greek-law compliance. Record the factual owner decisions, consent sibling integration, UI preview, exact publication and hosted route evidence separately.

## Official sources checked 14 October 2026

- [GDPR, Articles 5, 6, 13, 17 and Chapter V](https://eur-lex.europa.eu/legal-content/EN/TXT/?qid=1731412878471&uri=CELEX%3A32016R0679): purpose limitation, legal bases, retention duration or criteria, erasure exceptions and transfer safeguards. Direct EUR-Lex opens encountered its JS challenge; its indexed official text and the authorities below supported this review.
- [Hellenic DPA decision 13/2024](https://www.dpa.gr/sites/default/files/2024-04/13_2024%20anonym.pdf): purposes, bases, recipients, transfers and retention information belong in transparent notice.
- [EDPB retention assessment](https://www.edpb.europa.eu/system/files/2021-09/dpc_final_decision_redacted_for_issue_to_edpb_01-09-21_en.pdf): generic criteria require scrutiny; category-specific reasoning matters.
- [Hellenic DPA statistical cookies](https://www.dpa.gr/el/enimerwtiko/thematikes_enotites/electronikesepikoinwnies/cookies/statistikh_cookies): statistical-cookie purpose alone does not exempt consent. It does not itself decide this cookie-free beacon's legal status.
- [Cloudflare customer DPA](https://www.cloudflare.com/cloudflare-customer-dpa/), [DO location hints](https://developers.cloudflare.com/durable-objects/reference/data-location/): restricted-transfer SCC mechanisms; hints are best effort, not guaranteed placement.
- [Cloudflare Web Analytics FAQ](https://developers.cloudflare.com/web-analytics/faq/), [collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/): beacon collection, sampling and report history. Provider claims are distinct from actual account/browser acceptance.
- [Resend DPA](https://resend.com/legal/dpa), [GDPR operations/retention](https://resend.com/security/gdpr): US processing, SCCs and category/plan-specific retention. Preserve existing true disclosure.
- [Stripe DPA](https://stripe.com/legal/dpa), [privacy policy](https://stripe.com/privacy): processor and own-controller roles, global transfers and purpose-specific retention. No account terms were accepted here.
- [Cloudflare Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/): static artifact `_redirects` with explicit status; this route patch makes no account change.

## Remaining owner facts

Confirm category-specific retention review practice and responsible operator; applicable statutory periods/start events; open-claim/legal-hold handling; mailbox/backup retention; actual Resend plan and contact/suppression handling; applicable Cloudflare/Stripe/Resend agreements and transfer-assessment evidence; analytics legitimate-interest/terminal-access assessment. Do not ask for credentials or paste private evidence into Git. Parent consolidates these questions with sibling scope rather than running a second owner interview.
