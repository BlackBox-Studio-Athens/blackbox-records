## Why

UAT currently uses GitHub Pages while PRD uses Cloudflare Pages. The release workflow also couples a push to `main` to multiple deployment targets. We need one hosting model and a predictable way to review a small UI or backend change in UAT before deliberately releasing it to PRD.

This is the first of two sequential changes. It establishes the deployment boundary that `replace-sveltia-with-emdash-operations` will reuse for independent content publication.

## What Changes

- **BREAKING:** Move the stable UAT public site to its own Cloudflare Pages project, using the same static Pages plus Worker model and root base path as PRD. Keep separate data, secrets, Stripe modes, Access audiences, and email effects.
- **BREAKING:** Relevant pushes to `main` deploy and test UAT only. PRD code deployment requires an explicit promotion of a particular successful UAT candidate, never an implicit deployment of the latest `main`.
- Build paired UAT/PRD artifacts from the same source SHA. Record target configuration, artifact identity, and hosted evidence using existing GitHub Actions artifacts and deployment metadata.
- Keep one stable UAT review URL. Review a candidate there, then promote its verified PRD-targeted artifact. No per-PR infrastructure, new branches, release service, or paid preview tooling is required.
- Preserve the PRD Holding Page, checkout launch controls, one-run live catalog authorization, static public site, persistent player, and canonical local URLs.
- Update URL validation, smoke defaults, cache checks, workflows, and operational documentation together. Do not leave GitHub Pages as a second active UAT publishing path.

## Capabilities

### New Capabilities

- `software-release-promotion`: Explicit UAT candidate review, revision-bound PRD promotion, serialized deployment, and safe recovery.

### Modified Capabilities

- `environment-model`: UAT and PRD use the same Cloudflare topology with isolated resources.
- `static-site-and-deployment`: Cloudflare UAT, matching cache behavior, target-specific artifacts, and explicit PRD promotion.
- `catalog-promotion-automation`: The current catalog preparation remains intact during this intermediate change but no longer implicitly authorizes PRD code deployment.
- `project-language`: Distinguish Software Release, Release Candidate, and code promotion from catalog preparation and shopper launch.
- `tooling-validation`: Validate the new UAT origin and promotion boundaries through existing checks and smoke suites.

## Impact

Primary implementation surfaces: `.github/workflows/pages.yml`, dependent smoke/holding workflows, `apps/web/astro.config.mjs`, environment profiles and verifiers, deploy/smoke scripts, `README.md`, and applicable `AGENTS.md` guidance. Backend commerce behavior is not being rewritten.

Implementation must first reconcile the completed, unarchived `replace-catalog-promotion` specification with its implemented behavior using the sync-specs workflow. This change's catalog delta targets that effective replacement contract, not the obsolete bot-commit/reset model. Do not archive or close unrelated changes automatically. Coordinate affected hosting assumptions with `production-go-live-readiness`; its live launch approvals remain outstanding.

Provisioning Cloudflare projects, credentials, DNS, or Access applications is implementation work requiring the relevant account access and explicit in-scope authorization. Planning does not perform it. Existing PRD domains and resources are not renamed or deleted.

Recommended implementer: Astra medium, one task section at a time. Complete and validate this change before the EmDash migration's hosted cutover.
