## Why

The shared newsletter block already renders a form and the Worker already exposes a newsletter registration endpoint, but the product contract does not yet define the user-facing success behavior or environment-isolated acceptance rules. This change makes the "Join the Collective" signup path explicitly usable and testable across Local, UAT, and PRD without cross-environment subscriber effects.

## What Changes

- Keep the embedded newsletter form in context after successful registration and show an accessible confirmation state instead of redirecting by default.
- Document redirect/success-page behavior as not the default for this embedded form; reserve a dedicated success route for a later no-JS form POST fallback or a standalone newsletter landing page.
- Verify the current homepage and about-page newsletter blocks submit through the public Worker API, handle success and failure safely, and never expose Resend provider details in the browser.
- Preserve environment isolation:
  - Local uses local mocks/fake config only.
  - UAT writes only through the UAT Worker and UAT Resend sink routing.
  - PRD writes only through the PRD Worker and PRD Resend configuration when PRD provider readiness is complete.
- Add focused automated and browser acceptance checks for successful registration, validation errors, provider-safe failures, and environment routing.

## Capabilities

### New Capabilities

- `newsletter-registration`: Public newsletter signup UX, Worker registration contract, accessible confirmation behavior, and Local/UAT/PRD acceptance rules.

### Modified Capabilities

- `environment-model`: Clarify that newsletter registration data/effects are scoped to the active Product Environment and must not bleed between Local, UAT, and PRD.

## Impact

- Affected frontend: `apps/web/src/components/NewsletterSignup.astro`, `apps/web/src/components/NewsletterSignupForm.tsx`, homepage/about usage, and tests around form states.
- Affected backend: existing `/api/newsletter/registrations` public Worker route, Resend-backed email application module, OpenAPI/client regeneration if the public contract changes.
- Affected validation: unit tests, `pnpm check`, `pnpm build`, Browser Use checks for the rendered form, `pnpm smoke:resend-uat` for UAT, and PRD config/readiness checks before any real PRD Contact write is accepted.
- No new provider, database, frontend state library, or custom newsletter management system.
