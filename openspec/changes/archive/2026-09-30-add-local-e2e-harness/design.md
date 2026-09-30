# Design

## Decisions

- **Runner.** `playwright/test` from the installed `playwright` package. `@playwright/test`, Vitest browser mode and LLM-driven runners were rejected: the first duplicates an installed package, the second cannot exercise the persistent shell across page swaps, and the third adds cost and nondeterminism.
- **Server.** `webServer` with `reuseExistingServer: true` and `pnpm site:dev`. Any responder on the canonical URL is reused, so astro dev, `site:dev:bg` and the full stack all work unchanged. When nothing serves 4321 the runner owns a foreground Astro process and stops it afterwards; `site:dev` still fails loudly on a taken port.
- **Base path.** `baseURL` includes `/blackbox-records/`; specs navigate with relative paths such as `store/` so the base path is never dropped.
- **Determinism.** The fixture stubs `/api/store/listing-prices`, `/api/store/items/<slug>` (a minimal ready offer from the public OpenAPI schema) and `/api/store/delivery-quote`, serves an empty Google Fonts stylesheet (the site uses `display=optional`), and serves an empty analytics script, which production builds such as the full stack's snapshot load. The player spec replaces Bandcamp and Tidal embeds with a local button fixture. A delayed route for the shell's Store fetch makes the 750 ms `Loading Store` feedback observable. A `window` sentinel proves shell navigation and history never reload the document.
- **Diagnostics.** The fixture reuses `attachSmokePageDiagnostics` from the smoke harness and fails on any console or page error, except Vite's hot-reload socket, which exists only under astro dev.
- **Routes.** The canonical route table and representative slugs move from the hosted UAT smoke into `scripts/smoke-core.ts`, so the hosted smoke and the local specs check one list.
- **Timeouts and workers.** Two workers and assertions that wait up to 30 s, because astro dev compiles each route and lazy chunk on first request and re-renders the Store listing on every request (about 7 s on the development machine, slower with more workers). A built site would allow the defaults.
- **Reporting.** `list` for terminal output and `json` to `.codex-artifacts/e2e/summary.json`, matching existing evidence conventions. Traces and screenshots are retained only on failure; each failure also writes `error-context.md` with the page's aria snapshot, readable without a GUI.
- **Scope.** Specs live in root `e2e/`, outside module ownership and the Nx graph, and never run in `pnpm validate`.
