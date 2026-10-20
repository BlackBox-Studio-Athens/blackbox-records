# Project contracts and edit points

Read the relevant row. Nx configuration and executable boundary policy own module roots, public entries and dependencies. MODULE.md supplies local invariants; read each changed module's guide when present, and only relevant dependency contracts. A root-started session must explicitly read these guides before edits.

| Concern                                                    | Entry / authority                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell, player, navigation                                  | [app-shell guide](../apps/web/src/components/app-shell/MODULE.md), [shell spec](../openspec/specs/app-shell-and-player/spec.md)                |
| Checkout rendering, consent, email preferences             | [checkout-web guide](../apps/web/src/components/store/checkout/MODULE.md)                                                                      |
| Checkout authority, orchestration, provider reconciliation | [checkout-core guide](../apps/backend/src/application/commerce/checkout/MODULE.md)                                                             |
| Stock, orders and shipping                                 | [commerce operations](commerce-operations.md), [shipping spec](../openspec/specs/shipping-fulfillment/spec.md)                                 |
| CMS drafts and accepted publication                        | [workspace](content-workspace.md), [publication](content-publication.md)                                                                       |
| Newsletter and consent                                     | [checkout-web](../apps/web/src/components/store/checkout/MODULE.md); backend email module configuration and current change's consent contracts |
| Staff editing/operations                                   | [workspace](content-workspace.md), selected staff module's project.json and tests                                                              |
| Source/version/release identity                            | [environment model](environment-model.md), [catalog promotion](catalog-promotion.md)                                                           |

## Local runtime

Use [Local runtime](local-runtime.md) for startup, ports, status, server reuse, leases and Local stack acceptance.

## Content and data

Read [content contracts](content-agent-contracts.md) before content/schema/persistence changes; operational owners remain the workspace, publication and commerce documents.

## Public frontend

Read [frontend contracts](frontend-agent-contracts.md) for shell continuity, imagery, metadata, section routes and price projections.

## Graphify context

The Blackbox index includes archived OpenSpec changes, which broad architecture queries can select as starting points. Include the relevant Blackbox module or symbol names when already known to locate the current domain. The root AGENTS.md sets Blackbox's query budget; global instructions own truncation and evidence handling.

## Nx workspace

Nx `project.json` files define app and module roots, targets and task inputs. Framework roots include `web-pages`, `web-layouts` and `web-test-support`. Each module's `project.json` `metadata.boundaries` declares its public entrypoints and allowed dependencies; the boundary manifest keeps workspace-package policy. Nx's import graph describes actual dependencies, including declared Astro runtime edges; it does not grant architectural permission. Native Vitest projects derive test ownership from module locations and runtime suffixes. Root contract tests run as five cached groups, `workspace:test-agent`, `test-release`, `test-runner`, `test-boundaries` and `test-content`, each with declared inputs in the root `project.json`; `pnpm test:contracts` runs all five. `scripts/check-module-projects.mjs` checks test ownership (each root test in exactly one group), module cycles, source ownership and that no root task except `format` hashes documentation or OpenSpec change files (`architecture` may hash the agent guidance documents it checks); cross-module commerce integration tests live under `apps/web/test/commerce/`, and backend cross-module tests under `apps/backend/test/integration/<feature>/`; single-module backend tests sit beside their source.
