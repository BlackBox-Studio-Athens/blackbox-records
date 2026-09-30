# Add a local end-to-end browser harness

## Why

Shell, player and routing acceptance currently relies on manual browser observation and screenshots (agent workflow acceptance matrix; AGENTS.md continuity checks). Browser Use is named as the authority for player, overlay, mobile-navigation and cart continuity. Manual inspection is slow, subjective and not repeatable, and agents cannot re-run it cheaply after each edit. The repository already has Playwright installed and an existing continuity sequence in the content-preview smoke, but no runner that targets the Local site.

## What changes

- Use the Playwright Test runner shipped with the installed `playwright` dev dependency. No dependency is added.
- Add a root `playwright.config.ts` and `e2e/` specs covering canonical routes, shell navigation with focus and scroll reset, the delayed Store status, overlays, mobile navigation, player minimize/reopen/stop continuity and cart persistence, on desktop and a 390px mobile viewport.
- A shared fixture fails every test on console or page errors, reusing the existing smoke diagnostics, and stubs Worker reads, provider embeds, Google Fonts and the production analytics script so runs need neither the stack nor external network.
- The hosted static smoke's code-owned route table moves into the shared smoke module so the hosted smoke and the local specs use one list.
- The runner reuses whatever serves port 4321 and otherwise starts `pnpm site:dev` for the run.
- Add `pnpm test:e2e`, include the new files in type-aware lint and Knip, and update the acceptance matrix, local-runtime reference and README.
- Deterministic specs become the required continuity check; Browser Use remains the authority for visual, performance and accessibility judgement.

## Scope

Local tooling and documentation only. No product behavior, CI job, `pnpm validate` integration or hosted operation changes. Worker-dependent checkout specs, a CI job, Firefox coverage and Playwright agent scaffolding are follow-ups.

## Acceptance

`pnpm test:e2e` passes with port 4321 free (the runner starts and stops Astro), with a background Astro server and with the full Local stack. A targeted spec runs alone. Failed tests leave a trace, screenshot and error context under `.codex-artifacts/e2e/`. `pnpm agent:check`, lint, format, strict OpenSpec validation and `pnpm validate` pass.
