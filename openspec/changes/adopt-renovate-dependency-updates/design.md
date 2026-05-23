## Context

The repo already relies on package-manager, TypeScript, lint, unit-test, build, and module-boundary gates. Dependency updates now span several compatibility clusters:

- Astro static frontend and React integration.
- Tailwind/shadcn styling packages.
- TypeScript, ESLint, Prettier, and Astro checking.
- Vitest, MSW, Playwright, and Cloudflare worker test tooling.
- Hono, Zod, Stripe, OpenAPI generation, and generated client contracts.
- Prisma D1 persistence packages.
- GitHub Actions and pnpm setup actions.

Some packages can update routinely. Others are runtime- or deployment-sensitive and need explicit owner review before they land.

## Direction

Use hosted Renovate for detection and PR creation, with repo-owned configuration controlling grouping, labels, semantic commits, and approval boundaries.

The first local update pass should use `pnpm update --latest --recursive` for direct dependencies, then repair any API or type drift found by the repo gates. Internal `workspace:*` dependencies stay workspace-owned and should not be converted to registry ranges.

## Renovate Grouping Policy

Low-risk or mostly toolchain packages can be grouped by ecosystem:

- Astro frontend build packages.
- React UI packages.
- Tailwind and shadcn packages.
- TypeScript lint and format packages.
- Test and browser automation packages.
- Process and script runner packages.

Runtime, persistence, deployment, and commerce-sensitive packages require dashboard approval and no automerge:

- Cloudflare Worker runtime and test adapter packages.
- Prisma D1 persistence packages.
- Backend API and commerce contract packages.
- GitHub Actions workflow dependencies.
- All major updates.

## Verification Strategy

Minimum verification for the first update pass:

- `pnpm install --frozen-lockfile`
- `pnpm renovate:validate`
- `pnpm test:unit`
- `pnpm check`
- `pnpm build`
- `pnpm audit:unused`
- `pnpm outdated --recursive --format json`, with only documented compatibility deferrals allowed
- `openspec validate --all --strict`

When Hono, Zod, OpenAPI, or generated-client dependencies change, rerun `pnpm generate:api`. When Prisma packages change, rerun the Prisma generation flow and include generated client changes.

## Decisions

- Keep TypeScript on the latest 5.x line until OpenAPI tooling supports TypeScript 6 peer ranges.
- Keep pnpm on the latest compatible v10 line for this slice.
- Defer pnpm 11 until its release-age policy can accept the lockfile or the repo intentionally changes pnpm supply-chain policy.
- Keep major Renovate updates behind dashboard approval.
- Keep hosted Mend.io setup documented separately from repo-owned config.
