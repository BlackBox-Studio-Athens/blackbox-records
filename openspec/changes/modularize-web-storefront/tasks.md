## 1. Slice 1: web-editorial

- [x] 1.1 Move news and releases presentation, `HomeHero` and `release-commerce` into `apps/web/src/components/editorial/` as `web-editorial`.
- [x] 1.2 Update consumers (`web-pages`), `storefront-catalog` exports and source-reading test paths.
- [x] 1.3 Run `pnpm test web-editorial`, `nx run workspace:architecture`, `pnpm --filter @blackbox/web check`, scoped eslint and `git diff --check`.

## 2. Gate

- [x] 2.1 Compare paired `nx affected` timings before and after slice 1 and record them in `design.md`; continue only if a news or release edit is measurably faster. Passed for `.ts`; `.astro` fixed by test-ownership move (2.2).
- [x] 2.2 Move cross-module source-reading tests to `web-pages`/`web-layouts` and drop the `**/*.astro` input from `storefront-catalog`.

## 3. Slice 2: web-artists

- [x] 3.1 Move artist cards, `ArtistDetailContent`, roster filters and their tests into `web-artists`.

## 4. Slice 3: web-store

- [x] 4.1 Move Store, Distro and Services presentation into `web-store` (excluding cart and checkout, which are already modules).
- [x] 4.2 Run `pnpm validate`, `pnpm audit:unused` and `graphify update .`.
