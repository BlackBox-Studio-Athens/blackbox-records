# Testing Patterns

**Analysis Date:** 2026-04-06

## Test Framework

**Runner:**

- `Vitest` `^4.0.18` from `package.json`
- Config: Not detected. No `vitest.config.*` file is present; the repo currently uses the script in `package.json`.

**Assertion Library:**

- Vitest's built-in `expect`, `describe`, `it`, and `vi`, as shown in `src/components/app-shell/player-session-machine.test.ts`, `src/components/app-shell/player-session-ui.test.ts`, `src/components/services/services-inquiry.test.ts`, and `src/lib/admin/decap-config.test.ts`.

**Run Commands:**

```bash
pnpm test:unit           # Run all committed unit tests via "vitest run" from `package.json`
pnpm exec vitest --watch # Manual watch mode; no dedicated package script is defined
# Coverage: Not configured
```

## Test File Organization

**Location:**

- Keep tests colocated with the source module they exercise.
- Current examples:
  - `src/components/app-shell/player-session-machine.test.ts`
  - `src/components/app-shell/player-session-ui.test.ts`
  - `src/components/services/services-inquiry.test.ts`
  - `src/components/artists/artist-roster-search.test.ts`
  - `src/lib/admin/decap-config.test.ts`
  - `src/lib/catalog-data.test.ts`

**Naming:**

- Use `*.test.ts` next to the implementation file.
- Current pairings include `src/components/app-shell/player-session-machine.ts` with `src/components/app-shell/player-session-machine.test.ts` and `src/lib/admin/decap-config.ts` with `src/lib/admin/decap-config.test.ts`.

**Structure:**

```text
src/
  components/
    app-shell/
      player-session-machine.ts
      player-session-machine.test.ts
      player-session-ui.ts
      player-session-ui.test.ts
    services/
      services-inquiry.ts
      services-inquiry.test.ts
  lib/
    admin/
      decap-config.ts
      decap-config.test.ts
```

## Test Structure

**Suite Organization:**

```typescript
// `src/components/app-shell/player-session-machine.test.ts`
describe('player session machine', () => {
  it('minimizes the session after player-surface interaction', () => {
    const openState = reducePlayerSessionMachine(IDLE_PLAYER_SESSION_MACHINE_STATE, { type: 'session-opened' });
    const loadedState = reducePlayerSessionMachine(openState, { type: 'iframe-loaded' });
    const interactedState = reducePlayerSessionMachine(loadedState, { type: 'player-surface-interacted' });
    const minimizedState = reducePlayerSessionMachine(interactedState, { type: 'dismiss-requested' });

    expect(minimizedState).toMatchObject({ status: 'minimized' });
  });
});
```

**Patterns:**

- Organize one `describe(...)` block per module or exported function family, as in `src/lib/admin/decap-config.test.ts` with separate suites for `resolveDecapSiteRootUrl`, `shouldUseLocalDecapBackend`, and `buildDecapConfig`.
- Build state transitions inline inside the test body instead of using beforeEach hooks. `src/components/app-shell/player-session-machine.test.ts` composes reducer calls directly so the transition sequence is visible in each assertion.
- Prefer precise regression assertions over snapshots. The current suite uses `toBe`, `toEqual`, `toMatchObject`, `toContain`, `not.toContain`, and call assertions instead of snapshot files.

## Mocking

**Framework:** `vi` from Vitest

**Patterns:**

```typescript
// `src/components/services/services-inquiry.test.ts`
const openWindow = vi.fn(() => null);
const navigateToHref = vi.fn();

openServicesInquiryMailtoInNewTab({
  mailtoHref: 'mailto:blackboxrecordsathens@gmail.com?subject=Fallback',
  navigateToHref,
  openWindow,
});

expect(navigateToHref).toHaveBeenCalledWith('mailto:blackboxrecordsathens@gmail.com?subject=Fallback');
```

**What to Mock:**

- Mock browser edges by dependency injection, not by patching globals. `src/components/services/services-inquiry.ts` accepts `openWindow` and `navigateToHref`, and `src/components/services/services-inquiry.test.ts` passes `vi.fn()` callbacks.
- Keep mocks local to the test body so the expected behavior is obvious from the test itself.

**What NOT to Mock:**

- Do not mock pure state or string builders. The current suite tests `src/components/app-shell/player-session-machine.ts`, `src/components/app-shell/player-session-ui.ts`, `src/components/artists/artist-roster-search.ts`, and `src/lib/admin/decap-config.ts` directly with real inputs.
- No `vi.mock(...)` module mocking is detected in the committed test files.

## Fixtures and Factories

**Test Data:**

```typescript
// `src/components/artists/artist-roster-search.test.ts`
const rosterItems = [{ title: 'Chronoboros' }, { title: 'Mass Culture' }, { title: 'Ouranopithecus' }];
```

**Location:**

- Keep fixtures inline as small constants in the test file.
- No shared fixtures or factory directories are detected.
- For config generation tests, use explicit inline option objects, as in `src/lib/admin/decap-config.test.ts`.

## Coverage

**Requirements:** None enforced.

**View Coverage:**

```bash
# Coverage tooling is not configured in `package.json` and no coverage config file is present.
```

## CI Verification

**GitHub Pages gate:**

- `.github/workflows/pages.yml` runs one `verify` job before deploy.
- The job uses `withastro/action@v6.1.1` on Node 24 with pnpm 10.33.2 and executes `pnpm test:unit && pnpm check && pnpm build`.
- The `deploy` job depends on `verify`, so any failing test blocks Pages publication.

**Decap-related CI behavior:**

- `.github/workflows/pages.yml` injects the DecapBridge and site environment values used by `src/pages/admin/config.yml.ts`.
- `src/lib/admin/decap-config.test.ts` covers the branch logic for proxy vs PKCE output, but CI does not run a separate integration test for rendered `/admin/config.yml`.

## Test Types

**Unit Tests:**

- Unit tests are the dominant style.
- Current unit coverage focuses on pure helpers and deterministic state logic:
  - `src/components/app-shell/player-session-machine.test.ts`
  - `src/components/app-shell/player-session-ui.test.ts`
  - `src/components/services/services-inquiry.test.ts`
  - `src/components/artists/artist-roster-search.test.ts`
  - `src/lib/admin/decap-config.test.ts`

**Integration Tests:**

- Separate integration test infrastructure is not detected.
- The closest integration-style unit is `src/lib/admin/decap-config.test.ts`, which verifies large YAML outputs assembled from realistic option objects rather than isolated helper internals.

**E2E Tests:**

- Not used.
- No Playwright, Cypress, or browser-driven test config is present in `package.json` or the repo root.

## Common Patterns

**Async Testing:**

```typescript
// Not detected in the committed unit tests.
// Current tests are synchronous and exercise pure helpers only.
```

**Error Testing:**

```typescript
// `src/lib/admin/decap-config.test.ts`
expect(yaml).not.toContain('auth_type: classic');
expect(yaml).not.toContain('\nclassic:');
```

## Shell, Player, And Admin-Specific Guidance

**Shell routing and player state:**

- Follow the existing split in `src/components/app-shell/`: test pure state helpers directly and keep the DOM-heavy shell orchestrator thin.
- `src/components/app-shell/player-session-machine.test.ts` verifies reducer transitions and `src/components/app-shell/player-session-ui.test.ts` verifies presentation derivation. There is no direct test file for `src/components/app-shell/AppShellRoot.tsx`.
- If shell-routing behavior changes in `src/components/app-shell/AppShellRoot.tsx` or `src/lib/app-shell/routing.ts`, add helper-level tests first and expect manual browser verification for history, overlay, and focus behavior.

**Decap config generation:**

- Keep `src/lib/admin/decap-config.test.ts` as the regression net for YAML generation. Assert specific emitted fragments with `toContain(...)` rather than snapshotting the full document.
- When adding new CMS fields in `src/lib/admin/decap-config.ts`, extend the test with positive and negative string assertions so proxy and PKCE output both remain correct.

**CI-aligned verification:**

- After any behavior change, the repo-standard verification path remains:

```bash
pnpm test:unit
pnpm check
pnpm build
```

- This matches both `README.md` and `.github/workflows/pages.yml`.

---

_Testing analysis: 2026-04-06_
