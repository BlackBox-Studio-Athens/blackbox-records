# checkout-web

## Scope and start

Owns checkout presentation and the public browser-checkout API seam. Start with [public-checkout-api.ts](public-checkout-api.ts), [public-checkout-presentation.ts](public-checkout-presentation.ts) and [email-preferences.ts](email-preferences.ts). The module's [project.json](project.json) declares exact public entries, the named browser-checkout-api interface and test inputs.

## Do not break

Browser state and displayed totals do not authorize price, stock or order mutations. Preserve authoritative offer reads, request/error handling and current sale/launch gates. Keep consent/newsletter ownership verification and withdrawal behavior aligned with current backend contracts. Shell-managed information/preferences navigation must preserve player continuity where specified; checkout document boundaries remain deliberate. Do not infer completed email/provider acceptance from rendered UI or local mocks.

## Contracts and decisions

Read [checkout spec](../../../../../../openspec/specs/commerce-checkout/spec.md), [commerce operations](../../../../../../docs/commerce-operations.md), relevant current consent change and the public API package contract. Nx edges do not authorize importing private backend code.

## Verification and work split

From repository root use `pnpm test checkout-web`, then required `pnpm validate`; select Local mock/browser/provider acceptance from [the matrix](../../../../../../docs/agent-acceptance.md). Claude implements summaries, form interaction, focus, copy and UI tests. Codex implements non-visual request/data logic and corresponding tests. Use an explicit API/state contract and one writer per shared file; a .ts or .tsx extension does not choose the owner.
