## 1. Setup

- [x] 1.1 Add `msw` where web/API-client tests can use it.
- [x] 1.2 Add Vitest setup for MSW server lifecycle.
- [x] 1.3 Keep MSW out of production frontend runtime code.

## 2. Handlers and Tests

- [x] 2.1 Create typed handlers for public checkout and selected internal stock API shapes.
- [x] 2.2 Migrate a small representative checkout or stock API/UI test set.
- [x] 2.3 Preserve pure helper tests without MSW when no HTTP boundary exists.

## 3. Verification

- [x] 3.1 Run targeted migrated tests.
- [x] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
- [x] 3.3 Use Browser Use only if rendered UI behavior changes.
