## Context

The Worker already owns checkout creation, verified Stripe webhooks, D1 order state, and stock changes. Email delivery is not yet modeled in baseline specs, and provider setup for Resend requires both repo verification and explicit operator-owned account/DNS/secret steps.

Resend has two different roles in this change:

- Runtime email provider called by the Worker through the official Resend SDK.
- Setup/diagnostic provider CLI used by operators and scripts before deployment.

This change includes paid-order transactional email, rich BlackBox-designed shopper and ops email templates, Resend-backed newsletter registration for existing signup forms, and shopper newsletter opt-in during purchase. Welcome email behavior, newsletter broadcast composition/sending, and provider resource automation should be proposed separately after this boundary is reviewed.

## Goals / Non-Goals

**Goals:**

- Keep Resend API keys, sender config, and ops recipients in Worker runtime config.
- Send rich paid-order shopper and ops emails only after the first verified paid Stripe reconciliation.
- Register newsletter subscribers through Resend Contacts and Topic/Segment enrollment from existing site forms and purchase opt-in.
- Keep the runtime and provider setup compatible with the Resend Free tier.
- Document manual provider readiness checks without committing a verifier script or provider-readiness evidence.
- Keep local tests deterministic through application-level provider mocks.

**Non-Goals:**

- No repo-owned newsletter broadcast composition/sending.
- No welcome email in this change unless explicitly added during review.
- No Resend provider account, API key, domain, DNS, template, Segment, Topic, or automation creation/mutation automation.
- No Resend CLI usage in production runtime.
- No public exposure of Resend provider IDs, API keys, D1 internals, Stripe secrets, raw webhook payloads, or raw shipping payloads.
- No automatic DNS mutation or Cloudflare Worker secret upload unless a later approved provider-automation slice adds credentials and explicit safeguards.

## Decisions

- **Use the official Resend SDK behind an infrastructure gateway.** Runtime delivery and newsletter contact operations use the `resend` package for email sending, Contact create/update, and Topic/Segment enrollment where supported. Route handlers, order reconciliation, and frontend code must not import the SDK directly. If a required provider operation is not supported by the SDK or fails in Cloudflare Workers, document the gap before adding a REST fallback.
- **Model email as an internal backend library boundary.** Add backend application services for transactional email and newsletter registration under a closed TypeScript-native modulith-style email module, backed by a Resend SDK infrastructure gateway. Consumers use a clean public root entrypoint or approved named interface only; templates, routing, idempotency, provider mapping, and Resend internals stay private. This keeps a clean cut without creating a new workspace package before multiple runtimes need it.
- **Use provider idempotency and local replay checks.** Shopper and ops paid emails use deterministic idempotency keys based on checkout session plus message purpose. Replayed Stripe webhook events and non-applied reconciliation results do not call Resend. Provider idempotency is a retry aid, not the only duplicate-send guard.
- **Publish `CheckoutOrderPaid` before paid-order email.** Verified Stripe webhooks are provider input, not the email trigger. After the first paid CheckoutOrder transition and stock reconciliation apply, the commerce side publishes an in-process `CheckoutOrderPaid` application event. The email listener handles that event through the email module public API. This keeps email behavior event-driven inside the modulith without adding Cloudflare Queues in v1.
- **Keep templates repo-owned and designed in this epic.** Rich shopper and ops HTML/text builders live in source with unit tests. Resend Templates are not required for v1, preventing dashboard drift from becoming runtime behavior. Email visuals match the current BlackBox site design language instead of inventing a separate email brand. Shopper emails are transactional order confirmations, not tax invoices or VAT receipts, and must avoid marketing blocks. Both shopper and ops templates include subject/preheader rules, provider tags, plain text, and preview coverage for mobile, long content, and dark-mode-safe colors.
- **Add an explicit BlackBox email art direction pass.** The paid-order emails should read as a compact BlackBox editorial receipt: monochrome near-black shell, hard borders, off-white text, muted metadata, restrained Store Blood accents only for commerce state or warnings, and practical human copy. Use email-safe tables and inline styles, but preserve the site's physical label language through typography hierarchy, spacing rhythm, labels, and a strong logo lockup. Do not let the email become a generic Stripe receipt, Shopify-style invoice, marketing newsletter, or dashboard alert.
- **Use the logo as a resilient brand lockup, not the only identity.** Paid-order emails use the public BlackBox logo image from an environment-scoped HTTPS URL and link it to the environment's public site URL. The logo appears once in the header at a controlled size with width and height attributes, useful alt text, and a nearby text fallback so blocked remote images still show `BlackBox Records` clearly. Do not embed base64 logo blobs, inline SVG, provider dashboard templates, or tracking-pixel-like decorative images. The email must remain understandable if the logo image is blocked.
- **Scope email brand assets through Worker config.** Add non-secret Worker runtime config for `EMAIL_BRAND_LOGO_URL` and `EMAIL_BRAND_HOME_URL` so Local/UAT/PRD can render the right public logo and site link without hardcoding one deployment target inside source. UAT should use the GitHub Pages UAT asset URL and PRD should use the Cloudflare Pages PRD asset URL until a custom public site domain is approved. These values are public URLs, not secrets, and must never expose Resend IDs, Stripe IDs, D1 data, or private provider evidence.
- **Keep email failure non-authoritative.** Paid-order email failure never rolls back order or stock state. Shopper and ops sends are evaluated independently, outcome logs stay provider-safe, Resend concurrent idempotency conflicts are retry-safe/non-fatal, idempotent payload mismatches are config/bug warnings, and manual resend is deferred to later operator tooling.
- **Keep newsletter registration provider-owned but app-mediated.** The Worker exposes a provider-safe newsletter registration endpoint, validates consent and email input, and creates or updates Resend Contacts with a required newsletter Topic opt-in through the backend email boundary. PRD writes real subscriber Contacts. UAT writes the sink Contact at `blackboxrecordsathens+TESTING@gmail.com` while preserving intended subscriber evidence safely. Segment assignment is optional and deferred until audience grouping is needed.
- **Capture newsletter consent evidence.** Newsletter registration stores safe consent evidence in Resend Contact properties, including consent source, copy version, consent timestamp, and newsletter Topic ID. The public form and checkout checkbox use clear BlackBox marketing copy, identify BlackBox as the sender, link to privacy/support context, and keep provider responses hidden from the browser.
- **Require explicit Topic subscription.** The Resend newsletter Topic is configured so Contacts do not receive newsletter Broadcasts unless they explicitly subscribe. Double opt-in, welcome email, honeypot, rate limiting, and CAPTCHA are not part of this change unless approved later.
- **Stay inside Resend Free tier.** The change must not require more than one verified custom domain, more than 3,000 transactional emails per month, more than 100 transactional emails per day, more than the free marketing contact allowance, dedicated IPs, paid overage, or paid support features.
- **Use `blackboxrecordsathens.com` as the verified sending domain.** The domain is bought through Spaceship and delegated to Cloudflare nameservers, so Cloudflare is the DNS control plane for Resend records and Cloudflare Email Routing records. The domain becomes the single Resend Free-tier sending domain for `orders@blackboxrecordsathens.com` transactional mail and future `newsletter@blackboxrecordsathens.com` newsletter mail, while Cloudflare Email Routing handles inbound aliases and catch-all forwarding to Gmail. Runtime reply-to uses `support@blackboxrecordsathens.com`, and ops notifications go directly to `blackboxrecordsathens@gmail.com`. DNS verification, SPF/DKIM/DMARC alignment, any SPF record merging, and Cloudflare Email Routing setup remain manual operator checkpoints. Runtime implementation may proceed against mocks and provider proof, but UAT/PRD live provider acceptance cannot complete until the domain DNS and Resend verification are done.
- **Treat Cloudflare DNS setup as a provider-proof prerequisite.** Before live Resend domain proof, Cloudflare must be authoritative for `blackboxrecordsathens.com`, the Cloudflare zone must contain the Resend DNS records, and any required SPF/DKIM/DMARC alignment must be resolved. Cloudflare Email Routing setup is required only where this task relies on inbound reply routing for `support@blackboxrecordsathens.com`.
- **Keep provider verification docs-only.** Operators may run Resend CLI commands such as `resend --version`, `resend doctor --json`, and read-only domain/sender/contact/topic checks during setup, but this change does not add a committed verifier script, readiness report, or evidence artifact. Only OpenSpec/docs record the required checkpoints and expected safe handling.
- **Gate runtime work on Resend SDK and CLI proof.** The first implementation step is validation: prove `resend --version`, `resend doctor --json`, Free-tier account fit, read-only `blackboxrecordsathens.com` domain/sender/contact/topic checks, and a Worker-compatible SDK import/send/contact shape for the intended account/team, or record an explicit manual checkpoint before continuing.
- **Route email by Product Environment.** UAT is the Worker sandbox runtime target and sends every application email to `blackboxrecordsathens+TESTING@gmail.com` through `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL`, while preserving intended recipients in safe test content/tags. UAT newsletter Contact writes also target the same sink email instead of real shopper or visitor addresses. PRD is the Worker production runtime target and ignores that override.
- **Use explicit runtime config names.** The Worker runtime contract includes `RESEND_API_KEY`, `RESEND_FROM_EMAIL=orders@blackboxrecordsathens.com`, `RESEND_REPLY_TO_EMAIL=support@blackboxrecordsathens.com`, `RESEND_OPS_TO_EMAIL=blackboxrecordsathens@gmail.com`, `RESEND_UAT_RECIPIENT_OVERRIDE_EMAIL=blackboxrecordsathens+TESTING@gmail.com`, and `RESEND_NEWSLETTER_TOPIC_ID`. `RESEND_NEWSLETTER_SEGMENT_ID` is optional and deferred.

## Risks / Trade-offs

- **SDK Cloudflare Worker compatibility issue** -> stop implementation and record the exact SDK gap before proposing a REST fallback.
- **Provider rate limits or outages** -> log paid-order email failures without undoing paid order reconciliation or stock changes.
- **Remote logo image is blocked by an email client** -> keep visible text branding and all transactional information in live text so the message remains coherent.
- **Shopper email fails while ops succeeds** -> ops notification includes a warning that shopper confirmation was not sent.
- **Email send succeeds but later webhook replay occurs** -> deterministic idempotency keys prevent duplicate sends within provider idempotency windows, and local first-paid-transition checks avoid runtime replay sends.
- **Event name drifts toward provider language** -> use `CheckoutOrderPaid`, not `PaymentSucceededEvent`, because the domain fact is the CheckoutOrder first becoming paid.
- **Operator setup drift** -> OpenSpec/docs list manual CLI, DNS, Email Routing, and secret checkpoints separately without committing provider-readiness scripts or evidence.
- **Missing shopper email in Stripe session** -> send ops notification with missing-email context and skip shopper confirmation rather than failing order reconciliation.

## Migration Plan

1. Prove provider readiness first: Cloudflare DNS authority and relevant Resend DNS records for `blackboxrecordsathens.com`, Resend Free tier fit, CLI access, domain/sender readiness, Contact/Topic readiness, and SDK Cloudflare Worker compatibility; record any Cloudflare Email Routing or secret setup that remains manual.
2. Add Worker env contract and runtime config validation for Resend sender, reply-to, ops recipient, UAT override, newsletter Topic, and Free tier assumptions.
3. Add backend email module boundaries and the Resend SDK infrastructure gateway before route or webhook callers depend on email behavior.
4. Build rich paid-order shopper and ops templates with HTML/text previews, logo lockup handling, email-safe BlackBox design tokens, provider-safe tags, outcome logging, and failure mapping tests.
5. Wire first-time paid Stripe webhook reconciliation to publish `CheckoutOrderPaid` after order and stock reconciliation succeed, then have the email listener call the email module public API.
6. Add the provider-safe newsletter registration endpoint and existing homepage/about form integration.
7. Add checkout newsletter opt-in after the newsletter endpoint and Contact/Topic behavior exist.
8. Update docs, module-boundary manifest, runtime-vs-verification guidance, Cloudflare/Resend DNS checkpoints directly relevant to sending and inbound reply routing, and run OpenSpec validation plus repo gates.
