# Module ownership checkpoint

Task 2.5 reconciles the existing implementation with the baseline manifest and specification. All modules remain closed, with no new dependency allowance or ownership exception.

| Responsibility                                   | Owner and supported interface                                     |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| Combined CMS Worker and editorial middleware     | `cms-runtime`; named `combined-worker` and `access-auth-provider` |
| Existing commerce Worker and schedule forwarding | `backend-runtime`; named `commerce-worker`                        |
| Paid-order retry processing                      | `orders`; existing `scheduled-paid-order-delivery`                |
| Runtime catalog records and repository contract  | `commerce-domain`; existing `repository-spi`                      |
| D1 catalog reads                                 | `commerce-persistence`; existing Prisma root export               |
| Catalog projection validation                    | `catalog-sync`; existing application root export                  |
| Staff source                                     | `staff-frontend`; internal API client workspace export            |
| Portable editorial constraints                   | `@blackbox/content-model`; package root export                    |

Staff assets remain build inputs, not cross-app source imports. CMS plugins have no allowed dependency on commerce persistence. The combined scheduler continues to report independent CMS and commerce failures. Runtime catalog wiring is still pending task 4.2 backfill and task 4.3 adoption; documenting ownership does not claim those behaviors are complete. Still-used Sveltia and compiled catalog roots remain owned until the explicit deletion tasks pass.

## Local verification

The existing module audit and dependency-cruiser audit pass across 410 modules and 916 dependencies. ESLint `lintText` probes use the actual configuration and real owning paths without writing source files. They reject CMS-to-commerce-persistence, public-web-to-CMS-server, and CMS-to-staff-source imports with `boundaries/dependencies`, while allowing the CMS operator-auth entrypoint. The runnable probe and result are `.codex-artifacts/emdash-m1/boundary-probes.mjs` and `boundary-probes.log`.

All work is local. No hosted API request, database mutation, KV operation, deployment, or plan upgrade is involved.

Task 2.5 is complete. `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation pass. Required-gate logs are `.codex-artifacts/emdash-m1/boundary-completion-{unit,check,build}.log`.
