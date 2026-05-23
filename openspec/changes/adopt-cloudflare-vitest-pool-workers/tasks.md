## 1. Setup

- [ ] 1.1 Add `@cloudflare/vitest-pool-workers` to `@blackbox/backend` test tooling.
- [ ] 1.2 Add a dedicated Worker-runtime Vitest config or script.
- [ ] 1.3 Configure local-only bindings with no real secrets and no sandbox/production D1 mutation.

## 2. Representative Coverage

- [ ] 2.1 Add one focused route, binding, or D1 seam test where Worker runtime semantics matter.
- [ ] 2.2 Keep pure domain/application tests on the current fast Vitest path.

## 3. Verification

- [ ] 3.1 Run the new Worker-runtime test command.
- [ ] 3.2 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
