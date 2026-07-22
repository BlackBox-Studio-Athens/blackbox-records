## ADDED Requirements

### Requirement: Services inquiry ownership uses existing closed modules

The system MUST place Services inquiry presentation, public HTTP composition, email application behavior, and provider delivery inside the existing module-boundary model without adding a new application module or dependency direction.

#### Scenario: Frontend Services inquiry ownership is recorded

- **WHEN** Services inquiry form and helper files are updated
- **THEN** `apps/web/src/components/services/**` is owned by the existing `storefront-catalog` module
- **AND** `ServicesInquiryForm.tsx` remains its provided entrypoint for `app-shell`
- **AND** the feature imports reusable controls through `ui-foundation` entrypoints.

#### Scenario: Public inquiry HTTP files are added

- **WHEN** the Services inquiry contract, route, and route-local service are implemented
- **THEN** the contract remains under the existing `public-contracts` named interface
- **AND** route-local files are listed under `public-commerce-http` roots
- **AND** they depend on `email-application` through its provided entrypoint rather than importing provider implementation.

#### Scenario: Inquiry email behavior is added

- **WHEN** Services inquiry use-case and template code are implemented
- **THEN** they remain under the closed `email-application` root
- **AND** provider sending continues through the existing `email-provider-spi`
- **AND** `resend-integration` remains the only module that imports the Resend SDK.

#### Scenario: Boundary validation runs

- **WHEN** implementation changes roots or entrypoints
- **THEN** `module-boundaries.manifest.json` and the module-boundaries spec are updated together
- **AND** the architecture manifest audit passes without a temporary ownership exception.
