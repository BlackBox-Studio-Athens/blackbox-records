## Why

The Services inquiry form currently depends on a device-level `mailto:` handler, so submitting can silently fail when no usable mail app is configured and scripted new-tab handling can lose or duplicate the handoff. A Worker-owned submission path is needed so visitors can send an inquiry from any supported browser while staying on the BlackBox site.

## What Changes

- Replace the primary `Compose Inquiry` mail-client handoff with a validated public Worker submission that sends through the existing Resend email boundary.
- Keep the visitor on the Services page and replace the form with an accessible inline success state only after the Worker reports provider acceptance; show a retryable inline error otherwise.
- Require name, visitor email, service, and message; keep Band / Project optional; add one short optional details prompt whose label and hint adapt to the selected service.
- Route General, Tour Booking, Merch Printing, and Vinyl Printing inquiries to fixed `@blackboxrecordsathens.com` service aliases that already forward to the existing Gmail inbox.
- Send one BlackBox-styled HTML email with a plain-text equivalent, preserve the existing verified Resend sender, set `Reply-To` to the validated visitor address, and avoid duplicating that address in the message layout.
- Retain a secondary native `mailto:` fallback plus visible/copyable recipient and inquiry details without forcing a new tab.
- Preserve Local mock delivery, UAT sink routing, and direct PRD alias routing through the existing Product Environment email policy.
- Do not add visitor confirmation email, attachments, D1 persistence, CAPTCHA, Turnstile, request rate limiting, a new provider, or a new dependency.

## Capabilities

### New Capabilities

- `services-inquiry`: Define browser submission, service-specific optional details, recipient routing, email content, inline status UX, fallback behavior, and verification for Services inquiries.

### Modified Capabilities

- `environment-model`: Scope Services inquiry email effects to Local, UAT, and PRD using the existing mock, UAT sink, and direct PRD delivery policies.
- `module-boundaries`: Record the Services inquiry frontend, public HTTP route, and email application entrypoints under their existing owning modules.

## Impact

- Frontend: Services inquiry React form, mailto helper/tests, public API client use, Services copy, accessibility states, and mobile/desktop browser validation.
- Backend: public OpenAPI contract and route, Services inquiry application use case and template, optional command-specific `Reply-To`, provider-safe logging/errors, and focused tests.
- Runtime/provider: existing Resend account, verified `blackboxrecordsathens.com` sender domain, Cloudflare-forwarded service aliases, Local mock gateway, and UAT recipient override; no new secrets or provider resources.
- Architecture/specs: existing `public-commerce-http`, `email-application`, and frontend ownership records plus generated API artifacts.
