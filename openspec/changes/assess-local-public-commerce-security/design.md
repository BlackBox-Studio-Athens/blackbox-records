# Design

## Context

The earlier plan (Strix with a GPT model in WSL2 Docker) was dropped. The owner requires free open-source tools with no LLM features, limited to the PRD public surface, tested Locally, optimized for speed and cost. See proposal.md for scope.

## Goals / Non-Goals

Produce reproducible findings with severity, location, evidence and a minimal fix, plus an honest coverage record. Zero findings in an area does not establish security. Source fixes, deployment and hosted testing beyond a few header reads are excluded.

## Decisions

- Static tools: gitleaks (full history, redacted), `pnpm audit --prod` and OSV-Scanner on `pnpm-lock.yaml` (triaged for runtime reachability with `pnpm why`), zizmor on `.github/workflows`, Semgrep CE (`p/javascript`, `p/typescript`, `p/owasp-top-ten`, metrics off) on `apps/web/src` and `apps/backend/src` excluding generated code and tests.
- Dynamic tools run only against the normal Local stack (`pnpm dev`, official Stripe mock, Resend no-network mock). Schemathesis uses the Worker's own public OpenAPI document with a small example budget. A Node script covers webhook signatures, internal-route rejection, checkout tampering, input validation, abuse caps and CORS.
- The Local operator bypass is loopback-only by design. Hosted-equivalent `/api/internal/*` rejection is verified from code and the existing Access JWT tests, not from Local responses.
- Hosted traffic is limited to four read-only GETs for headers (PRD Pages home and `/store/`, the custom domain, PRD Worker `/api/store/capabilities`), in line with the Free-tier rule.
- OWASP ZAP was skipped: it needs a large download and would mostly repeat the header finding already confirmed by the hosted GETs.

## Risks / Trade-offs

- Local mocks cannot prove Stripe or Resend behavior; provider-side rejections (for example oversized addresses) remain unverified.
- No Local item is Coming Soon or pay-what-you-want and in stock, so alert-cap and mixed-cart behavior relies on code and unit tests plus the sold-out rejection path.
- Edge controls configured only in the Cloudflare dashboard (WAF or rate-limiting rules) are invisible to this assessment.
