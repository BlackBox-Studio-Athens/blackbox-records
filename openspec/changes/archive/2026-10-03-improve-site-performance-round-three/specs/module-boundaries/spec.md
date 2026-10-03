## MODIFIED Requirements

### Requirement: Closed module boundaries

The system SHALL treat application modules as closed by default with explicit provided interfaces and named interfaces.

#### Scenario: Code imports another module

- **GIVEN** code in one application module needs another module
- **WHEN** it imports or calls that module
- **THEN** it targets the module's provided interface or approved named interface
- **AND** it does not deep-import another module's internal implementation.

#### Scenario: Public scroll ownership respects web module boundaries

- **GIVEN** the app shell, Store features, and private-preview code use the public scroll API
- **WHEN** those modules call the shared scroll operations
- **THEN** `web-platform` owns the implementation at `apps/web/src/platform/lib/lenis-scroll.ts`
- **AND** app-shell exposes its `apps/web/src/components/app-shell/lenis-scroll.ts` entrypoint to shell components
- **AND** lower-level modules do not depend on app-shell internals.

#### Scenario: Shell enhances a newsletter form

- **WHEN** the persistent shell lazily mounts the newsletter form after document or section navigation
- **THEN** `storefront-catalog` provides `components/NewsletterSignupForm.tsx` through its declared entrypoints
- **AND** the shell imports that entrypoint without taking ownership of newsletter content or submission behavior.

#### Scenario: Checkout and terms share delivery constants

- **WHEN** `checkout-core` calculates delivery charges and the public Terms page renders the same rates
- **THEN** they consume the browser-safe constants from the declared `@blackbox/api-client/public` workspace export
- **AND** `checkout-core` declares that workspace-interface permission while checkout independently revalidates delivery authority.

#### Scenario: Public presentation uses lightweight helpers

- **WHEN** listings show checkout availability or a public image transformation fails
- **THEN** checkout provides its lightweight presentation helper entrypoint and `web-platform` provides its native public image fallback entrypoint
- **AND** those entrypoints do not load the cart schema or checkout request client.

#### Scenario: Public layouts preload bundled fonts

- **WHEN** public layouts or 404 import the same font URLs as their bundled CSS
- **THEN** `storefront-catalog` provides the Veneer asset, Latin Inter, Geist Mono and Bebas Neue assets, and font stylesheet through declared entrypoints
- **AND** binary font assets remain outside JavaScript lint parsing.
