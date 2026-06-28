## 1. Decisions

- [x] 1.1 Use single explicit opt-in for the first usable newsletter form.
- [x] 1.2 Use subscribed/registered success copy; do not use "Check your inbox" copy without double opt-in.
- [x] 1.3 Allow PRD newsletter signup before checkout PRD-open after PRD Resend readiness passes.
- [x] 1.4 Do not add Turnstile, honeypot, custom rate limiting, or other anti-abuse in this slice.

## 2. Current Behavior Audit

- [x] 2.1 Verify homepage and about-page newsletter blocks render the shared `NewsletterSignupForm`.
- [x] 2.2 Verify form submissions use `createPublicCheckoutApi().registerNewsletterSignup()` and the generated public Worker contract.
- [x] 2.3 Verify the Worker route validates payloads, requires provider config server-side, returns provider-safe success/error responses, and keeps `Cache-Control: no-store`.
- [x] 2.4 Verify the Resend newsletter Topic uses opt-out default behavior and Contact registration applies explicit Topic opt-in through the backend email application boundary.
- [x] 2.5 Verify Resend Contact registration stores consent evidence through the backend email application boundary.

## 3. UX Implementation

- [x] 3.1 Preserve embedded in-page submission; do not redirect on successful homepage/about signup.
- [x] 3.2 Ensure success state uses the agreed copy, clears unsafe stale input state, and remains announced through an accessible status region.
- [x] 3.3 Ensure missing consent, invalid email, and provider-unavailable states show clear public copy without provider internals.
- [x] 3.4 Keep the visual treatment hard-edged and BlackBox-owned: no rounded promo card, no provider embed, no gradient, no icon grid, no fake urgency.
- [x] 3.5 Verify desktop layout keeps a single stable email/action row where space allows and mobile layout stacks full-width controls without text overlap.
- [x] 3.6 Ensure status/error live-region containers are present before updates, use polite status behavior for non-errors, and use alert/assertive atomic behavior for blocking errors.
- [x] 3.7 Mark invalid email or consent controls with programmatic invalid state and associate them with visible error text.
- [x] 3.8 Add or update unit tests for idle, submitting, success, consent error, API error, invalid-control accessibility, and no-provider-leak behavior.

## 4. Environment Isolation

- [x] 4.1 Verify Local tests use mocks/fake provider identifiers and do not require real Resend secrets.
- [x] 4.2 Verify UAT registration targets only the UAT Worker and UAT sink routing through `pnpm smoke:resend-uat`.
- [x] 4.3 Verify PRD readiness checks use only PRD-scoped Resend config, are independent from checkout PRD-open, and fail closed when required PRD setup is missing.
- [x] 4.4 Update docs only where setup, acceptance, or PRD policy changes from the current repo contract.

## 5. Acceptance

- [x] 5.1 Run `pnpm test:unit`.
- [x] 5.2 Run `pnpm check`.
- [x] 5.3 Run `pnpm build`.
- [x] 5.4 Use Browser Use to verify rendered newsletter signup success, consent error, provider-safe failure, and no redirect on local pages.
- [x] 5.5 Run UAT smoke when UAT credentials/target are available: `pnpm smoke:resend-uat`.
- [x] 5.6 Record PRD readiness result as passed, blocked, or `not_configured`; do not perform real PRD Contact writes until PRD Resend readiness passes.
