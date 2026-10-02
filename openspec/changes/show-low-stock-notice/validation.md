# Validation notes

## Local repository and browser checks — 2026-10-02

- Base SHA `aa2bfae91890d074e4efa99e777c057d38500c2f` plus this change's working tree. `pnpm validate` (`mode: local`, scope all) passed with matching before/after fingerprint `4be85703663ab95a69f75fca4df7007c2085a1b733b020536457eda03c25aa5c`, covering affected module tests, lint, typecheck and architecture checks. The summary is in ignored artifacts under `.codex-artifacts/validation/`.
- Environment: Claude Code cloud container, Local only, Node 24.21.0. No stack, provider or hosted checks ran.
- Rows selected:
  - Commerce/checkout/stock: Worker unit and worker-pool tests passed, covering the classifier, listing reader, offer reader, D1 operator repository and the listing integration test (one query, effective stock after holds).
  - Staff/editor: the staff API client test passed. The staff switch was not exercised in a browser.
  - Shell/player/routing: only the Store card status changed. `pnpm test:e2e e2e/store-cart.spec.ts -g "copies left"` passed in chromium-desktop and chromium-mobile.
  - CMS/publication and release rows: not applicable, because content and release are unchanged.
- Browser observation: with stubbed Worker reads, the Store card showed `Only 3 left` beside the price with Buy visible, and the item page showed `Only 2 left` above Add To Cart at 1280 px and 390 px.
- `pnpm openspec -- validate show-low-stock-notice --type change --strict` passed.
- Unverified:
  - Migration `0026` on UAT/PRD D1.
  - The staff switch against a running Local stack.
  - Real fonts. The screenshots used the fallback typeface.
