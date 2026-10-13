# Tasks

## 1. Static checks

- [x] 1.1 Scan full Git history with gitleaks (redacted) and a targeted pattern pass for Resend, webhook and live Stripe keys; triage every hit.
- [x] 1.2 Run `pnpm audit --prod` and OSV-Scanner on `pnpm-lock.yaml`; trace flagged packages with `pnpm why` and record runtime reachability.
- [x] 1.3 Run zizmor on `.github/workflows`.
- [x] 1.4 Run Semgrep CE on `apps/web/src` and `apps/backend/src` (generated code and tests excluded); triage results within scope.

## 2. Local dynamic checks

- [x] 2.1 Start the normal Local stack only when free and confirm the Worker and site answer.
- [x] 2.2 Run Schemathesis against the Local Worker's public OpenAPI with a small example budget; reproduce each failure.
- [x] 2.3 Run scripted checks: webhook signatures, `/api/internal/*` rejection, checkout tampering and idempotency, newsletter/alert/inquiry/withdrawal validation and abuse caps, CORS, simple-request CSRF.
- [x] 2.4 Verify hosted-equivalent `/api/internal/*` rejection from code and the focused Access JWT test.
- [ ] 2.5 OWASP ZAP baseline (skipped: large download, would repeat the header finding).

## 3. Hosted read-only

- [x] 3.1 Read response headers with four GETs: PRD Pages home and `/store/`, the custom domain, PRD Worker `/api/store/capabilities`.

## 4. Handoff

- [x] 4.1 Rewrite proposal, design and findings for the free-tool scope; record ranked findings, coverage, tool versions and rerun commands.
- [x] 4.2 Stop the Local stack this assessment started and confirm with `pnpm local:status`.
- [x] 4.3 Validate the change with `pnpm openspec -- validate assess-local-public-commerce-security --type change --strict`.
