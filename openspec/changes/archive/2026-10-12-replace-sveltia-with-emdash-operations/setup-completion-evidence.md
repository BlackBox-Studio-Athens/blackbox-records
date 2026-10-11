# Item Setup completion persistence

The operation repository now finishes an initialized setup in one D1 transaction: it records the prepared CMS presentation, item type, and price kind, increments the catalog revision once, and completes/releases the journal claim. Generic journal advancement cannot bypass this completion method.

Completion requires a current claim, the unchanged catalog revision and CMS linkage, the recorded Product/Price mapping, existing stock, and a withheld item. It does not publish, enable checkout, or reset inventory. The application still must validate and derive the presentation from CMS content before calling this persistence seam.

The Release/Distro Local D1 tests now cover the persistence sequence from source linkage through identity, binding, stock, and completion. Completion checks include expired/stale claims, changed mapping, transaction rollback on a failing catalog update, repeated completion, retained completed-operation replay, one revision increment, and preservation of later stock movement. Full Item Setup application/API orchestration and CMS presentation validation remain unfinished; tasks 7.2 and 7.3 remain open.

No hosted calls or persistent Local database mutations occur. Test identities and provider data are synthetic.

Verification passes: `pnpm test:unit`, `pnpm check`, `pnpm build`, and strict OpenSpec validation. Logs: `.codex-artifacts/emdash-m1/setup-complete-{unit,check,build,openspec}.log`.
