## Source and repository checks

- Prepared in the app-created worktree `claude/press-email-change-443090` on base SHA `00afb49c2aaea3e6ee8a31aa5913b21952c52828`; implementation is a working-tree change committed locally.
- `pnpm openspec:guard --allow-worktree` and `pnpm openspec -- --allow-worktree validate update-about-contact-directory --type change --strict`: passed.
- `vitest` over `src/pages`, `src/components/app-shell`, `src/layouts` and `src/components/ui` (apps/web module config): 59 files, 265 tests passed. `pnpm test:app-shell`: 41 files, 196 tests passed.
- `pnpm test:e2e e2e/about-contact.spec.ts`: passed. Full `pnpm test:e2e` against this worktree's Astro on 4321 (owner checked first): 41 passed, 5 project-scoped skips. Summary: `.codex-artifacts/e2e/summary.json`.
- These notes and completed task boxes are written before the final validation rerun; its summary path, fingerprint, mode and status are retained in `.codex-artifacts/about-contact/final-validation.json` so recording them does not change the tested tree.

## Delivery proof

Product Environment: provider check from the operator machine, 2026-10-01.

- DNS: `blackboxrecords.com` uses Afternic nameservers, a null MX (`.` priority 0) and `v=spf1 -all`; it cannot receive mail, so no probe was sent there.
- `resend doctor`: API key valid; `blackboxrecordsathens.com` verified.
- One probe each from `orders@blackboxrecordsathens.com` to `info@`, `demos@` and `touring@blackboxrecordsathens.com`; `resend emails get` reported `last_event: delivered` for all three. This proves Cloudflare MX acceptance, not a dedicated alias (a catch-all would also accept). The operator confirmed all three probes arrived in the label Gmail inbox. Resend dashboard showed the same three as Delivered. No CLI output is committed.

## Browser acceptance

Product Environment: Local, `http://127.0.0.1:4321/blackbox-records/about/`. Acceptance rows: shell/player/routing (copy listener and snapshot sanitizer live in the shell). Commerce, CMS publication and release rows do not apply.

- Chrome extension, blackbox profile, 1440 px window: General full width, Demo Submissions and Tour Booking as two columns; each row is the mailto link plus a 36 × 36 outline copy button 16 px from the edge; no horizontal overflow; no console errors. The clipboard promise stayed pending in that window because Chrome reported it `hidden` (known occlusion limit), so the copy itself is proven by Playwright, which reads the real clipboard after direct shell navigation and after a cached return inside the feedback window.
- Built-in pane emulation at 390 and 320 px: rows stack, the copy button stays on the link row, addresses wrap inside the link and the page has no horizontal overflow. The copied state (check mark) was rendered by setting `data-copied` for the screenshot.
- Focus order is DOM order (each row's link, then its copy button); the Chrome click left focus on `Copy touring@…`. The visible focus ring comes from the shared button family. Row hover (`:has()` under `hover: hover`) is covered by source tests only; it was not observed in a browser.
- Screenshots: `.codex-artifacts/about-contact/desktop-1440.png`, `mobile-390-copied.jpg`.

## Release boundary

No UAT/PRD Content Publication or Software Release was performed. Hosted About content keeps the old addresses until task 4.1.
