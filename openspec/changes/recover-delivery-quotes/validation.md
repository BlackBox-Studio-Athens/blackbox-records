# Delivery quote recovery validation

Product Environment: Local. Base source SHA: `59f20954c1ea5b6c33024777e9a80368e4aac85b`. Worktree: `C:/Users/SVall/.codex/worktrees/checkout-delivery-recovery/blackbox-records`. No edits were made in shared main.

## Scope and acceptance

Commerce/checkout acceptance applies: preserve current-cart authority and payment gating, recover a temporary quote failure and retain cart quantities and newsletter choice. Backend behavior and public API contracts are unchanged. Shell, provider, publication and release acceptance are outside this focused change; no routing/player change or payment submission occurred.

The baseline defect and initial 503 injection are recorded in the supplied `blackbox-ux-laws-audit.md` and `blackbox-ux-audit-evidence.json` under `C:/Users/SVall/Documents/Codex/2026-10-19/d-downloads-ux-laws-design-guide/outputs/`. Source investigation confirmed failures were collapsed to null with no retry trigger. New browser checks inject two 503 responses before allowing a current authoritative-shaped quote; null responses exercise the distinct unsupported-cart state.

## Checks

- `pnpm openspec:guard --allow-worktree`: passed. All CLI operations use the authorized worktree opt-in.
- `pnpm test checkout-web`: passed, 9 files and 150 tests. Tests cover retry after transport/408/429/500/503 failure, repeated failure, duplicate activation, pending retry, cart change, late success/failure, unmount and unavailable carts. Summary tests cover both drawer and review.
- `pnpm test:e2e e2e/checkout-delivery-recovery.spec.ts --project=chromium-desktop --project=chromium-mobile`: passed, 3 tests, 1.6 minutes. Desktop 1440px and mobile 390px demonstrate failure, repeated failure, one pending retry after double activation, disabled payment while pending, recovery to EUR 23.00, unchanged cart storage and retained newsletter choice. No horizontal overflow; no page exceptions in recovery checks. No payment was submitted.
- `pnpm openspec -- validate recover-delivery-quotes --type change --strict --allow-worktree`: passed.
- `graphify update .`: passed, 29,543 nodes and 47,025 edges. Existing limitations: SQL parser unavailable and an unrelated workflow test partially parsed. No semantic enrichment was requested.
- `git diff --check`: passed.
- `pnpm validate`: passed all 62 tasks across 48 projects in 172.7 seconds, `mode: local`, one pass, `sourceChanges: []`. Summary: `.codex-artifacts/validation/2026-10-19T13-25-40-342Z-46776-b39ae2/summary.json`. Matching before/after source fingerprint: `fc2caf8167fcc968b2aff957c02d2e139ded5e61853558b30e3fe15fefaaf925`. The earlier run found two test-only type-import lint errors, which were corrected; its automatic rerun passed tasks but was invalidated by that source change and is not completion evidence.

This evidence note and task completion were recorded after that stable passing run. The final documentation-inclusive validation summary and fingerprint are retained in `.codex-artifacts/checkout-delivery-recovery/final-validation.json` to avoid a self-changing evidence note. The five source/test hashes in `source-hashes.json` must match both runs; browser implementation and fixture sources are unchanged from browser acceptance.

## Evidence

- `.codex-artifacts/e2e/summary.json`
- `.codex-artifacts/e2e/test-results/checkout-delivery-recovery-ab2cf-serves-the-cart-and-consent-chromium-desktop/retry-pending.png`
- `.codex-artifacts/e2e/test-results/checkout-delivery-recovery-ab2cf-serves-the-cart-and-consent-chromium-desktop/retry-recovered.png`
- `.codex-artifacts/e2e/test-results/checkout-delivery-recovery-87577--the-cart-and-consent-phone-chromium-mobile/retry-pending.png`
- `.codex-artifacts/e2e/test-results/checkout-delivery-recovery-87577--the-cart-and-consent-phone-chromium-mobile/retry-recovered.png`
- `.codex-artifacts/checkout-delivery-recovery/source-hashes.json` binds the five changed source/test files. Pending desktop and recovered mobile captures were visually inspected.

## Limits

Browser evidence uses the worktree's static Local server at port 4351 with deterministic mocked quote and capability responses. The formerly recorded primary Local stack refused connections and was no longer active; a full provider stack was not restarted. These checks do not establish actual provider, hosted, physical-phone, Safari, screen-reader or completed-payment acceptance. The broader checkout loading-state and layout work remains separately owned. No Store format behavior or Home film was changed. No merge, push, deployment or publication was performed by this task.
