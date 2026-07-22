## Context

The Services page currently builds a `mailto:` URL in the browser and calls `window.open(..., '_blank', 'noopener,noreferrer')`, then treats the required `null` return as popup failure and also navigates the current page. Even without that bug, `mailto:` depends on a configured device handler, cannot confirm success, and cannot produce a controlled rich email.

The backend already has a public Worker route pattern, code-first OpenAPI generation, Product Environment email routing, a Local mock gateway, a UAT recipient sink, a Resend gateway, a shared BlackBox HTML/text template, provider-safe errors, and idempotent transactional email sending. Cloudflare Email Routing already forwards `@blackboxrecordsathens.com` aliases to the existing Gmail inbox. Resend remains sending-only for the custom domain.

## Goals / Non-Goals

**Goals:**

- Make inquiry submission work through normal HTTPS form delivery on supported mobile and desktop browsers without requiring a local email client.
- Keep the visitor on the Services page through submission, error, and success states.
- Deliver one useful, structured HTML/text email to the alias for the selected service and make normal Reply address the visitor.
- Keep a usable mail-app and copy fallback without relying on popup or new-tab behavior.
- Reuse existing public HTTP, email application, environment routing, Resend, API generation, styling, and test patterns.

**Non-Goals:**

- No visitor account, confirmation email, attachment upload, draft storage, D1 record, operator dashboard, queue, webhook, new provider, new dependency, or new module.
- No Turnstile, CAPTCHA, honeypot, browser challenge, per-IP rate limit, or application request throttling.
- No Resend Receiving enablement or custom-domain MX change.
- No guarantee that the optional `mailto:` fallback can launch an unconfigured device mail app.

## Decisions

### Make Worker submission primary and success an inline page state

`ServicesInquiryForm` posts JSON to `POST /api/services/inquiries` through the generated public API client. During submission, the button is disabled and status is announced without shifting the surrounding layout. Provider acceptance replaces the form with an inline success panel containing concise confirmation, expected follow-up wording, and a `Send another inquiry` action. Failure keeps the entered values and shows a retryable inline error plus fallback actions. No successful or failed submission opens a new tab or leaves the Services page.

Alternatives rejected:

- Fixing only the scripted `mailto:` handoff still leaves unconfigured devices without a reliable submission path.
- A dedicated success route adds navigation and loses the audience-retention benefit of in-context confirmation.

### Reuse the existing public HTTP and email application seams

Add one public OpenAPI contract, one route registration, and one route-local service following the newsletter pattern. The route validates a strict body containing `name`, `email`, optional `bandOrProject`, `service`, optional `serviceDetails`, and `message`. It returns provider-safe `400` or `503` errors and `{ status: 'submitted' }` only after the existing provider gateway accepts the email.

Add one Services inquiry use case and template under `apps/backend/src/application/email/`. Reuse `sendTransactionalEmail`, `createBlackBoxEmailTemplate`, recipient sink routing, provider-safe tags, and the existing Resend gateway. Extend `TransactionalEmailCommand` with an optional validated `replyTo`; `sendTransactionalEmail` uses it when present and otherwise preserves `config.replyToEmail` for every existing caller. Generate a Worker-owned submission ID for the existing Resend idempotency key. No new provider interface or runtime service is added.

### Keep recipient routing server-owned and fixed

The browser sends the service enum, never a recipient address. The email application maps services to existing catch-all aliases:

- `General` → `info@blackboxrecordsathens.com`
- `Tour Booking` → `booking@blackboxrecordsathens.com`
- `Merch Printing` → `merch@blackboxrecordsathens.com`
- `Vinyl Printing` → `vinyl@blackboxrecordsathens.com`

These fixed, non-secret addresses stay in application code rather than creating four environment variables. Cloudflare Email Routing forwards them to the existing Gmail inbox. `RESEND_FROM_EMAIL=orders@blackboxrecordsathens.com` and all current Resend runtime bindings remain unchanged. The visitor address becomes the command-specific `Reply-To`.

Alternatives rejected:

- Accepting a browser-supplied recipient would create an open-relay boundary.
- New recipient environment variables add deployment/configuration work for values that do not vary by Product Environment.
- Enabling Resend Receiving is unrelated because these aliases already forward through Cloudflare.

### Use one adaptive optional question

Keep the form short. Name, email, service, and message are required. Band / Project remains optional. One optional `serviceDetails` input changes label and hint with the selected service:

- General: `Useful context`
- Tour Booking: `Date / City / Venue`
- Merch Printing: `Item / Quantity / Deadline`
- Vinyl Printing: `Format / Quantity / Target Date`

Use native required/email behavior plus accessible inline errors. The Worker remains authoritative and trims/validates the same fields with limits: name 100 characters, email 254, Band / Project 160, service details 300, and message 2,000. Unknown service values and unknown body fields are rejected.

Alternatives rejected:

- Multiple per-service fields make the form longer and create mostly empty email sections.
- A free-form message alone misses concise operational facts that help answer the inquiry.

### Send one escaped HTML email with a plain-text equivalent

Subject format is `Services Inquiry — <Service> — <Band / Project or Name>`. The BlackBox template contains:

1. `New services inquiry` heading and service label.
2. Contact rows for Name, Email, and Band / Project when supplied.
3. The selected service-detail label/value when supplied.
4. A clearly separated Message section.
5. A note that replying addresses the visitor.

All visitor values are HTML-escaped before interpolation. The plain-text body follows the same order. The visible visitor email appears once; provider headers carry the same value only as `Reply-To`. No email is sent back to the visitor.

### Keep mail-app and copy fallbacks secondary

Remove scripted `window.open` handling. Render a normal `mailto:` link targeting the server-owned service alias, with UTF-8 encoded subject/body and CRLF line breaks. Do not set `_blank`. Beside it, expose the recipient and a native Clipboard API action that copies the current plain-text inquiry; keep the recipient and summary visible/selectable if clipboard access fails. The no-JavaScript fallback shows the public recipient address as selectable text as well as a normal mail link.

### Preserve existing Product Environment email policy

- Local uses the existing mock email gateway and makes no provider mutation.
- UAT routes the intended alias through `uat-sink@ambkime.resend.app`, so testing does not reach Cloudflare aliases or Gmail.
- PRD sends to the intended service alias and ignores the UAT override.

Extend the existing Resend UAT smoke with one synthetic Services inquiry provider-acceptance check. Do not inspect or persist message bodies. Alias-to-Gmail forwarding remains a manual provider/DNS readiness check because UAT intentionally bypasses those aliases.

### Accept a friction-free public endpoint without anti-abuse controls

Per product decision, v1 adds no challenge or request throttling. It still performs strict schema validation, bounded field lengths, HTML escaping, provider-safe errors, submit-button pending protection, and logging that excludes visitor message content. Provider quota or abuse can therefore make submissions unavailable; a later OpenSpec change may add controls if observed traffic requires them.

## Risks / Trade-offs

- Public endpoint can consume Resend quota or send inbox noise → accepted product risk; keep inputs bounded, logs content-free, and provider failures safe to visitors.
- Alias forwarding is external configuration → manually prove all four aliases reach the Gmail inbox before PRD acceptance.
- Provider acceptance is not final inbox delivery → success copy says `submitted`, not `delivered`.
- No persistence means a provider/forwarding loss cannot be recovered from BlackBox storage → retain structured provider logs and use the visitor-facing retry/fallback path.
- Existing `orders@` sender is broader than the Services context → preserve current verified runtime contract and clarify purpose through display content, subject, recipient alias, and Reply-To.
- Native mail fallback can still fail on devices without a handler → copyable recipient/details remain independent of the handler.

## Migration Plan

1. Add the email use case/template, optional transactional `Reply-To`, public contract/route, generated client, and focused backend tests.
2. Replace the primary mailto form action with Worker submission, adaptive optional details, inline status/success UI, and secondary fallback actions.
3. Update module-boundary manifest/spec entries and Services copy; regenerate OpenAPI artifacts.
4. Run `pnpm test:unit`, `pnpm check`, and `pnpm build`; validate form, errors, success, fallback, and responsive behavior with Browser Use.
5. Deploy the Worker before the static frontend, run the synthetic UAT inquiry check against the managed sink, and manually prove each PRD alias forwards to Gmail.

Rollback restores the prior static form action and copy. No database or provider migration must be reversed; the unused Worker route can be removed or left unreachable until follow-up.

## Open Questions

None.
