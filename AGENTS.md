# BlackBox Records

Inherit the global AGENTS.md. This file contains project-specific routing and constraints only.

## Working location

Prepared work belongs on `main` in `C:\Users\SVall\WebstormProjects\blackbox-records`. Separate branches or worktrees require an explicit user request. Before OpenSpec edits or implementation, run `pnpm openspec:guard`; use `pnpm openspec -- <args>` for the guarded CLI. An explicitly authorized worktree uses the existing `--allow-worktree` opt-in.

## Read for the task

Start with the relevant row. Use [README](README.md) when setup or product context is missing; a small edit does not require reading every document. The task-state, acceptance and edit-point guidance below applies to every implementation task (Claude Code imports it; Codex reads it when implementing):

@docs/agent-workflow.md
@docs/agent-reference.md

| Task                                                     | Project references                                                                                                                                                          |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local startup, ports, tooling or validation              | [Agent workflow](docs/agent-workflow.md), [local contracts](docs/agent-reference.md#local-runtime), [validation feedback](docs/validation-feedback.md)                      |
| Public shell, player, navigation or presentation         | [Shell and player spec](openspec/specs/app-shell-and-player/spec.md), [frontend edit points](docs/agent-reference.md#public-frontend)                                       |
| CMS, content schema, staff or publication                | [Content workspace](docs/content-workspace.md), [content publication](docs/content-publication.md), [content contracts](docs/agent-reference.md#content-and-data)           |
| Checkout, prices, stock, orders or shipping              | [Commerce operations](docs/commerce-operations.md), [checkout spec](openspec/specs/commerce-checkout/spec.md), [shipping spec](openspec/specs/shipping-fulfillment/spec.md) |
| Ownership, imports, shared packages or module boundaries | [Boundary spec](openspec/specs/module-boundaries/spec.md), [executable manifest](openspec/specs/module-boundaries/module-boundaries.manifest.json)                          |
| Environment, release, catalog promotion or hosted work   | [Environment model](docs/environment-model.md), [catalog promotion](docs/catalog-promotion.md), [Free-tier rule](docs/cloudflare-free-tier.md)                              |
| Runtime diagnosis                                        | [Worker observability](docs/worker-observability.md), [runtime performance](docs/runtime-performance.md)                                                                    |
| Domain naming                                            | [Project language](openspec/specs/project-language/spec.md)                                                                                                                 |

## Project constraints

- Blackbox Graphify queries default to `--budget 2500`; keep queries focused and follow the global truncation rule. Use `graphify query "<question>"` for codebase questions, `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. Prefer `graphify-out/wiki/index.md` for broad navigation when it exists; read `graphify-out/GRAPH_REPORT.md` only for broad architecture review. Run `graphify update .` once after a meaningful code edit batch and after pull/merge.
- Cloudflare stays on Free. Read the Free-tier rule before quota-consuming hosted work; authenticated GETs can write sessions. CMS builds reject KV bindings in source and generated configuration.
- Product Environments are Local, UAT and PRD. Live catalog authorization, code promotion and shopper launch are separate gates; follow catalog promotion and the current change's acceptance criteria.
- CMS drafts remain private until Content Publication accepts a snapshot. Content Publication and Software Release are separate operations.
- The Worker owns commerce authority. Public code uses browser-safe API contracts; D1 owns stock and order state. Preserve closed module ownership; a module's public API and allowed dependencies live in its `project.json` `metadata.boundaries`, updated together with the boundary spec.
- Shell navigation preserves the persistent player. Changes to routing, overlays or player state require the continuity checks in the agent workflow.
- OpenSpec is the only repository spec and task-state workflow. Baselines live in [specs](openspec/specs/); unfinished work lives in [changes](openspec/changes/). Keep acceptance, decisions and evidence in the relevant change.

## Completion

- Run `pnpm test <module|file>` or `pnpm test:watch <module>` while editing and `pnpm validate` on the final tree. Reuse evidence only for its recorded source fingerprint.
- [feedback-policy.json](feedback-policy.json) decides what runs locally. Whole-project commands run in CI; locally they need a time-boxed maintainer grant, which only the maintainer issues with `pnpm feedback:grant-full <minutes>`.
- Use the [acceptance matrix](docs/agent-workflow.md#acceptance-matrix) for additional behavior checks and the [evidence record](docs/agent-workflow.md#completion-evidence) for the handoff. Local validation alone does not establish browser, provider or release acceptance.
- `pnpm agent:check` checks this entry point and its supporting agent documents. Update the relevant operational owner when commands or contracts change.
