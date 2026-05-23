## 1. Setup

- [x] 1.1 Add `@cloudflare/vitest-pool-workers` to `@blackbox/backend` test tooling.
- [x] 1.2 Add a Worker-runtime Vitest config and make it the default `@blackbox/backend` test path.
- [x] 1.3 Configure local-only bindings with no real secrets and no sandbox/production D1 mutation.
- [x] 1.4 Add a separate Node Vitest fallback only for backend tests that cannot run in the Workers runtime.

## 2. Backend Runtime Coverage

- [x] 2.1 Move backend HTTP route, env/binding, D1/Prisma, checkout, webhook, and internal stock API confidence tests to the Workers-pool path where feasible.
- [x] 2.2 Keep only Node-specific local script, generator, or process-orchestration tests on the Node fallback path.
- [x] 2.3 Remove hand-rolled D1 stubs from tests that can use local Workers-pool D1 bindings instead.

## 3. Verification

- [x] 3.1 Run the backend default Workers-pool test command.
- [x] 3.2 Run the backend Node fallback command if any fallback tests remain.
- [x] 3.3 Run `pnpm test:unit`, `pnpm check`, and `pnpm build`.
