## Implemented boundary

- Editorial Store Item content produces deterministic committed catalog artifacts.
- A bot commit owns generated drift; all UAT promotion and deployment steps use that exact commit.
- UAT promotion runs repository gates, config/webhook checks, D1 readiness, provider dry-run/apply, post-apply verification, Worker deploy, hosted listing readiness, static deploy dispatch, smoke, and redacted evidence.
- Price behavior, stock authority, environment naming, distro source data, and webhook endpoint rules remain in their dedicated specs.
- PRD remains dry-run/not_configured while the PRD-open gate is closed. Live mutation and launch evidence belong to production-go-live-readiness.

## Evidence

- July 20, 2026 run 29722231260 passed the UAT path and reported PRD gated/not_configured.
- Later bad commits stopped at repository gates before provider mutation.
- Evidence is limited to app identities, counts, commit/run references, statuses, and rerun guidance; secrets, full provider IDs, raw payloads, payment data, and customer data are excluded.
