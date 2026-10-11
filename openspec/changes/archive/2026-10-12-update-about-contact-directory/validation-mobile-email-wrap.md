# Contact email wrapping repair, 11 October 2026

## Cause and repair

Reproduced on the primary `main` checkout in the Local Astro site at
`http://127.0.0.1:4321/blackbox-records/about/`. At 320px, the original row left
only 110px for its address. `overflow-wrap: anywhere` split addresses into three
arbitrary lines; at 414px it could leave `.com` alone. Secondary columns at
768px and 820px showed the same problem.

Narrow rows now place their controls beside the role and give the address a
full-width line. Mailbox plus `@` and domain stay together as separate parts;
emergency wrapping remains available when enlarged text cannot fit a part.
The native link, exact address, copy value, authored order and wider desktop
composition are preserved. Explicit link labels keep screen readers from
inserting a space into the address between its visual parts.

## Observed acceptance

- `pnpm test apps/web/src/pages/_about-contact-presentation.test.ts`: passed the
  `web-pages` project. The subsequent repository validation also passed its
  updated source assertions.
- `pnpm test:e2e e2e/about-contact.spec.ts`: **4 passed**, Chromium desktop,
  Chromium mobile and WebKit mobile. The browser checks measure rendered text
  at 320, 360, 375, 390, 414, 430, 640, 768, 820, 1024 and 1440px, including
  820×390 landscape; only a single line or an `@` boundary break is accepted.
  They also verify no clipping or horizontal page scrolling, exact mailto and
  accessible names, visible copy controls, focus and 200% contact text.
- At 320px all addresses use two lines with the complete domain on the second.
  At 360px only Touring needs two lines; from 375px all current addresses fit
  one line. Tablet secondary columns retain the complete address.
- Isolated Chrome visual inspection at 320, 390, 768 and 1440px passed. Enlarged
  labels and addresses at 320px have no clipped or overlapping boxes. All three
  copy controls wrote their exact authored value on direct load. The existing
  automated copy check also passed after shell navigation and cached return.
- WebKit focus follows the existing shell-test convention: links are focused
  directly because iOS Safari skips them on Tab without Full Keyboard Access;
  Tab from each link still reaches its copy button. Chromium verifies the full
  sequential link/button order.

Browser report: `.codex-artifacts/contact-email-mobile/e2e-summary.json`.
Measurements and copy evidence: `layout-measurements.json`, `text-and-copy.json`
in the same folder. Screenshots: `before-320.png`, `contact-320.png`,
`contact-390.png`, `contact-768.png`, `contact-1440.png` and
`contact-320-text200.png`.

## Source and repository checks

Source HEAD before the local commit:
`7c687756cd1f50611bee16ef6ae47278dc3aabf6`.

After the final production and browser-test edits, `pnpm validate` passed all
59 selected tasks in `mode: local`, with
matching before/after fingerprint
`6c10b77607fbfd1f1c8c646b946e7bf39a56b7c8987cebd626428544e18f6340`.
Summary: `.codex-artifacts/validation/2026-10-11T16-25-19-912Z-17132-622965/summary.json`.
Only this evidence closeout and task completion markers followed that run;
`.codex-artifacts/contact-email-mobile/completion.json` records the final
validation summary, matching source fingerprints and local commit receipt.

`pnpm openspec -- validate update-about-contact-directory --type change --strict`
passed. Graphify was refreshed with local AST extraction; its existing partial
parser warning in `scripts/pages-workflow-contract.test.ts` is unrelated.

Acceptance is public presentation and existing contact interaction in Local.
Routing, player lifecycle, CMS/schema/publication, commerce, provider delivery
and release behavior are unchanged and require no additional acceptance here.
No physical phone was available. No email was sent and no push, publication or
deployment was performed for this repair.
