## Context

The site already has `NewsletterSignup.astro` on the homepage and about page, a React `NewsletterSignupForm`, a generated public API client, and a Worker route at `/api/newsletter/registrations`. The backend already registers Contacts through the email application boundary and Resend, with UAT sink routing and provider-safe public responses.

For an embedded newsletter block, the modern default is not a full-page redirect. The user should stay in context and receive an accessible inline confirmation. A dedicated success route is useful only for standalone signup pages, non-JS POST/redirect/get fallback, or campaign analytics that need a separate landing URL.

## Goals / Non-Goals

**Goals:**

- Make the existing newsletter button visibly and functionally usable from rendered pages.
- Keep successful signup feedback inline, accessible, and provider-safe.
- Verify Local, UAT, and PRD behavior without subscriber or provider effects crossing environments.
- Preserve explicit consent and unsubscribe-anytime copy.
- Keep the implementation on the existing Worker and Resend boundaries.

**Non-Goals:**

- No new newsletter provider, CRM, database table, queue, or frontend state library.
- No welcome email, broadcast composer, preference center, or mailing-list admin UI.
- No double opt-in confirmation email in this slice.
- No Turnstile, honeypot, custom rate limit, or other anti-abuse layer in this slice.
- No PRD real Contact writes until PRD Resend readiness is verified.

## Decisions

1. **Use inline success, not redirect.**
   - Chosen: after `status: registered`, replace/settle the form state with an inline confirmation in the existing `role="status"` region.
   - Alternative: redirect to `/newsletter/success/`.
   - Rationale: embedded forms should avoid unnecessary navigation, preserve the user's reading context, and already have an accessible live status region. Redirect can be added later for a no-JS POST fallback or standalone signup page.

2. **Reuse the existing public Worker route.**
   - Chosen: keep browser submissions going through `createPublicCheckoutApi().registerNewsletterSignup()`.
   - Alternative: direct provider form embed or client-side Resend call.
   - Rationale: Worker-owned provider calls keep API keys, Topic IDs, sink routing, provider errors, and consent metadata out of the browser.

3. **Keep environment isolation at the Worker/provider boundary.**
   - Chosen: Local uses mocks/fake config; UAT uses the UAT Worker and sink Contact routing; PRD uses only PRD Worker config and ignores UAT sink overrides.
   - Alternative: share one provider audience across UAT and PRD with tags.
   - Rationale: tags are weaker than separate runtime/config boundaries and are easier to misuse during acceptance.

4. **Keep single explicit opt-in for this slice.**
   - Chosen: required checkbox plus Resend Topic opt-in through the existing backend registration flow.
   - Alternative: double opt-in with a confirmation email and pending subscriber state.
   - Rationale: single opt-in matches the requested first usable form. Double opt-in can be added later if bounce rate, spam signups, or legal review requires the extra confirmation step.

5. **Use smallest anti-abuse measure needed now.**
   - Chosen: validation, consent requirement, provider-safe failure handling, no provider data in logs/browser, and existing smoke tests.
   - Alternative: Turnstile/honeypot/rate limiting now.
   - Rationale: no anti-abuse layer is needed for launch. Add Turnstile or rate limiting when spam appears or before high-traffic PRD campaigns.

6. **Allow PRD newsletter before checkout PRD-open.**
   - Chosen: PRD newsletter registration may open after PRD Resend readiness passes, even if checkout remains disabled.
   - Alternative: keep newsletter registration blocked behind the same checkout PRD-open gate.
   - Rationale: newsletter signup is independent from payment/provider mutation and can be validated through PRD-scoped Resend config without opening checkout.

## UI / UX Design Brief

**Register:** brand surface. The newsletter block is part of the public label site, not an admin form or ecommerce conversion widget.

**Scene:** a listener or distro buyer reaches the block after browsing releases on a dark, image-led label site, often on mobile after scrolling. They should see one obvious action, understand what they are consenting to, and get a quiet confirmation without losing their place.

**Inspiration to adapt, not copy:**

- Modern embedded newsletter forms keep the user in context after signup and replace the form feedback with a compact confirmation.
- Minimal newsletter products use one email input, one submit action, and plain consent language instead of multi-step funnels.
- Better brand sites make signup feel like joining a publication/community, not entering a marketing database.

**Visual direction:**

- Keep the current hard-edged BlackBox frame: near-black panel, thin border, no rounded promotional card, no gradient, no glass, no icon-card treatment.
- Treat "Newsletter" as small metadata, "Join the Collective" as the poster-style title, and the description as one short line group capped around 65 to 75 characters.
- Use one decisive input row on desktop: email field grows, submit button has fixed width, both share height and square corners.
- On mobile, stack email and button full-width with stable `h-11` controls; keep consent below the action, not hidden behind a modal.
- Use existing monochrome tokens by default. If state color is needed, use a restrained Store Blood or ink-tint border only for error/active state; do not introduce a new green success palette.
- Do not add social-proof counters, urgency copy, privacy-policy walls, provider badges, decorative envelope icons, or a separate success page in this slice.

**Interaction states:**

- Idle: email field, submit button, explicit consent checkbox, note, visually hidden status.
- Missing consent: keep focusable controls in place, show an inline `role="alert"` message below the note: `Confirm newsletter consent before subscribing.`
- Submitting: disable email, consent checkbox, and submit button; button text becomes `Subscribing` with the existing loading treatment; no layout shift.
- Success: clear the email and checkbox; show inline `role="status"` copy: `Subscribed. Future BlackBox Records updates will go to that email.` Keep the form available for another signup unless implementation chooses a compact success panel with a visible "Use another email" action.
- Provider unavailable: show `Newsletter signup is temporarily unavailable.` as inline `role="alert"` copy; preserve the typed email so the visitor can retry.
- Invalid email: rely on native `type="email"` validation in the browser and Worker `400` validation as the server boundary; if Worker returns invalid-email copy, show it inline without provider detail.

**Accessibility and motion:**

- Keep the email label available to assistive tech.
- Keep status and error containers present in the DOM before updates so assistive tech can register them.
- Use `role="status"` with polite announcement behavior for neutral/submitting/success updates.
- Use `role="alert"` or assertive live behavior with `aria-atomic="true"` for blocking errors.
- Associate visible error text with the affected control using `aria-describedby`, and mark the invalid email input or consent checkbox with `aria-invalid="true"` when that control causes the error.
- Do not rely on color alone for success or error.
- If state changes animate, use opacity/transform only, respect reduced motion, and avoid moving controls while the visitor is typing.

**Provider configuration:**

- Configure the Resend newsletter Topic with an opt-out default so Contacts do not receive newsletter mail unless explicitly subscribed.
- Keep the per-Contact registration behavior as explicit Topic `opt_in` only after the visitor accepts consent.

## Low-Fi State Mockups

These mockups are illustrative, not pixel-perfect acceptance criteria. The requirements and design brief above are authoritative.

Desktop idle:

```text
┌──────────────────────────────────────────────────────────────┐
│ NEWSLETTER                                                   │
│ JOIN THE COLLECTIVE                                          │
│ Get BlackBox Records release news, distro drops, event notes,│
│ and label updates.                                           │
│                                                              │
│ [ your@email.com                                  ] [SUBSCRIBE]│
│ [ ] I agree to receive BlackBox Records release, distro, and │
│     event updates. I can unsubscribe anytime.                 │
│ NO SPAM. UNSUBSCRIBE ANYTIME.                                │
└──────────────────────────────────────────────────────────────┘
```

Desktop success:

```text
┌──────────────────────────────────────────────────────────────┐
│ NEWSLETTER                                                   │
│ JOIN THE COLLECTIVE                                          │
│ Get BlackBox Records release news, distro drops, event notes,│
│ and label updates.                                           │
│                                                              │
│ [ your@email.com                                  ] [SUBSCRIBE]│
│ [ ] I agree to receive BlackBox Records release, distro, and │
│     event updates. I can unsubscribe anytime.                 │
│ Subscribed. Future BlackBox Records updates will go to that  │
│ email.                                                       │
└──────────────────────────────────────────────────────────────┘
```

Mobile idle:

```text
┌──────────────────────────────┐
│ NEWSLETTER                   │
│ JOIN THE COLLECTIVE          │
│ Get BlackBox Records release │
│ news, distro drops, event    │
│ notes, and label updates.    │
│                              │
│ [ your@email.com            ]│
│ [ SUBSCRIBE                 ]│
│ [ ] I agree to receive...    │
│ NO SPAM. UNSUBSCRIBE ANYTIME.│
└──────────────────────────────┘
```

## Risks / Trade-offs

- Single opt-in admits typo/spam addresses -> add double opt-in in a separate change if bounce rate, spam signups, or legal review requires it.
- Inline success gives no separate analytics URL -> add `/newsletter/success/` only if campaign measurement needs route-level attribution.
- UAT sink routing can hide intended-recipient mistakes -> smoke evidence must prove the Worker target and sink behavior without printing provider details.
- PRD readiness may be incomplete -> PRD validation reports `not_configured`/blocked until required Resend runtime config and Topic behavior are proven.

## Migration Plan

1. Confirm current form/API behavior with tests before changing UX.
2. Adjust only form state/copy/tests if the current inline confirmation is not good enough.
3. Keep OpenAPI/client unchanged unless the API response needs a new public status.
4. Validate Local with unit tests, `pnpm check`, `pnpm build`, and Browser Use on the rendered form.
5. Validate UAT with `pnpm smoke:resend-uat` against the UAT Worker.
6. Validate PRD readiness with runtime config verification; perform real PRD Contact writes only after PRD Resend readiness passes.

Rollback is a frontend-only revert if UX copy/state changes; backend route behavior remains unchanged unless tests expose a bug.

## Resolved Decisions

- Single opt-in for this slice.
- Success copy uses a subscribed/registered confirmation, not "Check your inbox."
- PRD newsletter registration may open before checkout when PRD Resend readiness passes.
- No extra anti-abuse layer in this slice.
