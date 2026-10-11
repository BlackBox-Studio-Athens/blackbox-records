# Item Setup binding persistence

The existing operation repository now saves the initial Product/Price mapping and advances to `price_bound` in one native D1 transaction. The method accepts the provider-validated Price identity and requires the recorded Product and CMS source, a current claim, unchanged catalog revision, and a withheld Store Item. Existing variant, Product, or Price mappings prevent insertion; nothing is overwritten.

The Local D1 setup tests now run identity creation, binding persistence, opening stock of ten, and a later stock movement through the real repositories. They cover stale/expired claims, a Product already bound elsewhere, a failing mapping insert rolling back journal progress, concurrent binding attempts, and replay after stock drops to eight. Replaying setup preserves eight physical and online units and the two ledger entries. The Store Item remains withheld throughout.

These are isolated local persistence checks with synthetic provider identities. They do not prove the complete provider/CMS/API workflow. Tasks 7.2 and 7.3 remain open for application orchestration, runtime projection, and final readiness. No hosted requests, KV operations, or persistent Local database mutations occurred.

Verification passes: `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation. Logs: `.codex-artifacts/emdash-m1/setup-binding-{unit,check,build,openspec}.log`. The initial boundary failure was corrected by importing the existing public commerce entrypoint; all three required commands passed afterward.
