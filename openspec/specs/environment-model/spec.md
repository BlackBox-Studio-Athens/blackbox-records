## Purpose

Define the Local, UAT, and PRD Product Environment model and map platform/provider-specific names under it.

## Requirements

### Requirement: Canonical product environments

The system SHALL expose exactly three product environments in operator-facing docs, workflows, validation output, and OpenSpec language: Local, UAT, and PRD.

#### Scenario: Environment matrix is presented

- **WHEN** a maintainer reads setup, deployment, promotion, or validation docs
- **THEN** the docs identify Local, UAT, and PRD as the product environments
- **AND** any platform-specific names are shown only as mapped implementation details.

#### Scenario: Runtime config names a product environment

- **WHEN** code, Worker bindings, tests, generated evidence, or validation reports name a Product Environment value
- **THEN** the canonical values are `LOCAL`, `UAT`, and `PRD`
- **AND** any `sandbox`, `production`, `test`, or `live` value is treated only as a mapped platform/provider trait.

#### Scenario: New environment wording is introduced

- **WHEN** a future change introduces `sandbox`, `production`, `test`, `live`, `GitHub Actions environment`, `Wrangler environment`, or `Stripe mode` wording
- **THEN** the change MUST classify that wording under the product environment mapping instead of treating it as a fourth product environment.

#### Scenario: Preview or branch deployment is introduced

- **WHEN** a workflow, host, or script creates a preview, branch, pull-request, or diagnostic deployment
- **THEN** that deployment MUST be classified as a non-product diagnostic surface
- **AND** it MUST NOT be used as UAT acceptance, PRD readiness, Promotion Evidence, or shopper-facing commerce proof.

### Requirement: Product environment mapping

The system SHALL maintain a single mapping from product environments to static hosts, Worker runtime targets, D1 data stores, Stripe/provider modes, secret stores, and validation gates.

#### Scenario: UAT mapping is evaluated

- **WHEN** UAT is described or validated
- **THEN** it maps to GitHub Pages static hosting, the uat Worker runtime target, UAT D1, Stripe test mode, UAT-scoped GitHub Actions credentials, and UAT Promotion Evidence.

#### Scenario: PRD mapping is evaluated

- **WHEN** PRD is described or validated
- **THEN** it maps to Cloudflare Pages static hosting, the prd Worker runtime target, PRD D1, Stripe live mode, and PRD-scoped GitHub Actions credentials
- **AND** it records that PRD checkout and live provider mutation are disabled until an explicit production-readiness gate opens them.
- **AND** it treats pre-go-live PRD evidence as readiness, disabled, or `not_configured` evidence rather than successful PRD Promotion Evidence.

#### Scenario: Local mapping is evaluated

- **WHEN** Local is described or validated
- **THEN** it exposes only `mock` and `uat-connected` as normal local modes
- **AND** any additional provider diagnostic command is documented outside the normal Local mode list.
- **AND** `mock`, `mock-api`, and `uat-connected` are not counted as additional product environments.

#### Scenario: Active production-facing plans are evaluated

- **WHEN** another active OpenSpec change describes production provider mutation, production proof, production checkout, or production launch readiness
- **THEN** that change MUST be reconciled with the PRD-disabled model
- **AND** it MUST identify whether the work is readiness-only, blocked by the PRD-open gate, or the owner of the PRD-open gate.

### Requirement: Platform names are scoped

The system MUST distinguish Product Environment from Platform Environment, Worker Runtime Target, Provider Mode, and Secret Store.

#### Scenario: GitHub Actions environment is referenced

- **WHEN** a workflow references a GitHub Actions environment
- **THEN** the environment is described as a credential/protection scope for a job
- **AND** it is not treated as the product environment source of truth.

#### Scenario: Wrangler environment is referenced

- **WHEN** a script or workflow references a Wrangler environment such as `sandbox` or `production`
- **THEN** it is described as a Worker runtime target mapped to UAT or PRD
- **AND** operator-facing commands SHOULD prefer product targets such as `uat` and `prd` once wrappers exist.

#### Scenario: Stripe mode is referenced

- **WHEN** Stripe test mode, Stripe live mode, or stripe-mock is referenced
- **THEN** it is described as a provider mode mapped to Local, UAT, or PRD
- **AND** it is not used as the product environment name.

### Requirement: Secret-store boundaries

The system MUST keep secrets in provider-native secret stores and MUST NOT treat env validation libraries as secret storage.

#### Scenario: Sensitive information is required again

- **WHEN** a maintainer must enter the same sensitive value into local config, GitHub Actions, Cloudflare Worker secrets, or Stripe provider settings
- **THEN** docs and preflight output explain that each store is intentionally isolated
- **AND** the system never asks the maintainer to paste the value into committed files, public Astro env vars, screenshots, logs, or chat.

#### Scenario: Env validation library is used

- **WHEN** `@t3-oss/env-core` is used
- **THEN** it validates local/process environment contracts without printing secret values
- **AND** it does not replace Cloudflare Worker secrets, GitHub Actions secrets, Stripe credentials, or ignored local secret files.

### Requirement: Newsletter effects are scoped by Product Environment

The system MUST scope newsletter registration effects to the active Product Environment.

#### Scenario: Newsletter environment boundary is evaluated

- **WHEN** Local, UAT, or PRD newsletter registration is described, configured, tested, or operated
- **THEN** the registration is mapped to that Product Environment's static host, Worker runtime target, Resend runtime config, and provider Contact behavior
- **AND** Local, UAT, and PRD newsletter registrations do not share mutable subscriber effects.

#### Scenario: Newsletter sink routing is evaluated

- **WHEN** UAT newsletter registration uses sink routing
- **THEN** the sink routing is treated as UAT-only behavior
- **AND** PRD ignores UAT sink overrides.

#### Scenario: PRD newsletter readiness is evaluated

- **WHEN** PRD newsletter registration readiness is evaluated
- **THEN** it is gated by PRD Resend readiness rather than checkout PRD-open status
- **AND** failed or missing PRD Resend config blocks PRD newsletter Contact writes.
