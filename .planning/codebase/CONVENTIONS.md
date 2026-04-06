# Coding Conventions

**Analysis Date:** 2026-04-06

## Naming Patterns

**Files:**
- Use `PascalCase` for Astro and React component files, as in `src/components/app-shell/AppShell.astro`, `src/components/app-shell/AppShellRoot.tsx`, `src/components/services/ServicesInquiryForm.tsx`, and `src/layouts/SiteLayout.astro`.
- Use `kebab-case` for helper and state modules, especially when the filename names one domain concept, as in `src/components/app-shell/player-session-machine.ts`, `src/components/app-shell/player-session-ui.ts`, `src/components/artists/artist-roster-search.ts`, and `src/lib/admin/decap-config.ts`.
- Name tests by colocating `*.test.ts` beside the implementation, as in `src/components/app-shell/player-session-machine.test.ts`, `src/components/app-shell/player-session-ui.test.ts`, and `src/lib/admin/decap-config.test.ts`.
- Keep route files aligned to URL shape and output type, as in `src/pages/admin/config.yml.ts`, `src/pages/admin/media/[collection]/[asset].ts`, and `src/pages/app-shell-overlay/releases/[slug].astro`.

**Functions:**
- Use `camelCase` verb-first names for helpers and event handlers: `resolveDecapSiteRootUrl`, `shouldUseLocalDecapBackend`, `buildDecapConfig`, `openShellSectionHref`, `closePlayerModal`, and `createArtistRosterSearcher`.
- Name route parsers and normalizers explicitly after their domain action in `src/lib/app-shell/routing.ts`: `normalizeAppPathname`, `parseOverlayRoute`, `parseShellSectionRoute`, and `buildOverlayFragmentUrl`.
- Use discriminated event names as lowercase kebab-case string literals in reducer-style helpers, as in `src/components/app-shell/player-session-machine.ts` with `'session-opened'`, `'dismiss-requested'`, and `'stop-requested'`.

**Variables:**
- Prefer descriptive `camelCase` locals and state variables over abbreviations, as in `servicesInquiryEmail`, `shellSectionTransitionTarget`, `overlayAbortControllerRef`, and `providerSelectionByTitleRef` in `src/components/app-shell/AppShellRoot.tsx`.
- Reserve `UPPER_SNAKE_CASE` for module-level constants and labels, as in `MAX_CACHED_IFRAMES`, `ROUTE_LOADING_RESET_DELAY_MS`, `EMBED_PROVIDER_PRIORITY`, and `OPEN_PLAYER_ACTION_LABEL` in `src/components/app-shell/AppShellRoot.tsx` and `src/components/app-shell/player-session-ui.ts`.
- Use explicit `data-*` dataset keys to bridge Astro-rendered HTML and the persistent shell in `src/components/app-shell/AppShellRoot.tsx`, for example `data-app-shell-main` and `data-music-streaming-service-embedded-player-trigger`.

**Types:**
- Prefer `type` aliases in `.ts` and `.tsx` modules for unions, records, and prop bags, as in `src/components/app-shell/AppShellRoot.tsx`, `src/components/app-shell/player-session-machine.ts`, and `src/lib/admin/decap-config.ts`.
- Use `interface Props` in `.astro` components and pages, as in `src/layouts/SiteLayout.astro`, `src/components/detail/ArtistDetailContent.astro`, and `src/pages/releases/[slug].astro`.
- Encode state machines and route parsing with discriminated unions and narrow string unions instead of free-form strings, as in `PlayerSessionMachineEvent` in `src/components/app-shell/player-session-machine.ts` and `OverlayKind` / `ShellSectionKind` in `src/lib/app-shell/routing.ts`.

## Code Style

**Formatting:**
- No formatter config file is present. `eslint.config.*`, `.eslintrc*`, `.prettierrc*`, `prettier.config.*`, and `biome.json` are not detected in the repo root.
- Follow the existing house style visible in `src/components/app-shell/AppShellRoot.tsx`, `src/lib/admin/decap-config.ts`, and `src/layouts/SiteLayout.astro`: single quotes, semicolons, trailing commas, and multiline object/array literals when values wrap.
- Keep Astro frontmatter imports at the top of the file and separate frontmatter from markup with `---`, as in `src/layouts/SiteLayout.astro` and `src/components/app-shell/AppShell.astro`.

**Linting:**
- No standalone ESLint or Biome setup is detected.
- Treat `pnpm check` from `package.json` as the enforced static verification command. It runs `astro check`, and CI executes it in `.github/workflows/pages.yml`.
- Keep TypeScript compatible with `astro/tsconfigs/strictest` from `tsconfig.json`.

## Import Organization

**Order:**
1. Put side-effect imports first when a file needs them, as in `import '@/styles/global.css';` at the top of `src/layouts/SiteLayout.astro`.
2. Import external libraries next, as in `react`, `react-dom`, `lucide-react`, and `astro` imports in `src/components/app-shell/AppShellRoot.tsx` and `src/layouts/SiteLayout.astro`.
3. Import internal modules through the `@/` alias after external dependencies, as in `src/components/app-shell/AppShellRoot.tsx`, `src/pages/admin/config.yml.ts`, and `src/layouts/SiteLayout.astro`.
4. Use `import type` for type-only imports when the file needs a runtime/value split, as in `src/layouts/SiteLayout.astro`, `src/components/app-shell/AppShellRoot.tsx`, and `src/components/app-shell/player-session-machine.ts`.

**Path Aliases:**
- Use the `@/*` alias from `tsconfig.json` for `src/*` imports.
- Prefer relative imports only for same-folder helpers, as in `./player-session-ui`, `./player-session-machine`, `./decap-config`, and `./artist-roster-search`.

## Error Handling

**Patterns:**
- Prefer guard clauses and safe fallbacks over deep nesting. `src/components/app-shell/player-session-machine.ts` returns the current state or `IDLE_PLAYER_SESSION_MACHINE_STATE` when an event is invalid for the current session.
- Return `null` or `false` for parse/apply failures that callers can branch on, as in `src/lib/app-shell/routing.ts` and the `applyShellPageSnapshot` / `openShellSectionHref` flow in `src/components/app-shell/AppShellRoot.tsx`.
- For browser fetch orchestration, catch and degrade to full navigation instead of leaving shell state broken. `src/components/app-shell/AppShellRoot.tsx` falls back to `window.location.assign(...)` if overlay or shell fragment loading fails.
- For configuration generation, choose a safe local backend instead of emitting broken auth config. `src/pages/admin/config.yml.ts` and `src/lib/admin/decap-config.ts` switch to the proxy backend when PKCE endpoints are missing or placeholders remain.

## Logging

**Framework:** None detected.

**Patterns:**
- No `console.*` usage is detected under `src/`, `scripts/`, or `.github/`.
- Favor explicit UI state, boolean return values, and typed fallbacks over runtime logging, especially in `src/components/app-shell/AppShellRoot.tsx`, `src/components/services/services-inquiry.ts`, and `src/lib/admin/decap-config.ts`.

## Comments

**When to Comment:**
- Comments are sparse. No `//` or `/**` guidance comments are detected in the main source files under `src/`.
- Encode intent in names and data structures instead of explanatory comments. The strongest examples are the explicit type names and constant labels in `src/components/app-shell/AppShellRoot.tsx`, `src/components/app-shell/player-session-machine.ts`, and `src/lib/app-shell/routing.ts`.

**JSDoc/TSDoc:**
- Not detected in the analyzed source files.

## Function Design

**Size:**
- Keep helper modules small and single-purpose. `src/components/app-shell/player-session-ui.ts`, `src/components/app-shell/player-session-machine.ts`, `src/components/services/services-inquiry.ts`, and `src/components/artists/artist-roster-search.ts` each expose a narrow API around one concern.
- Central browser orchestration lives in one large component, `src/components/app-shell/AppShellRoot.tsx`. When changing shell routing or player behavior, prefer adding or reusing small helpers inside that component or in `src/lib/app-shell/routing.ts` instead of scattering global scripts.

**Parameters:**
- Use object parameters when a helper needs several named inputs, as in `derivePlayerPresentationState` in `src/components/app-shell/player-session-ui.ts`, `buildServicesInquiryMailto` in `src/components/services/services-inquiry.ts`, and `buildDecapConfig` in `src/lib/admin/decap-config.ts`.
- Use discriminated event objects for reducer transitions, as in `PlayerSessionMachineEvent` in `src/components/app-shell/player-session-machine.ts`.

**Return Values:**
- Pure helpers return typed objects or strings, not side effects, as in `derivePlayerPresentationState`, `buildServicesInquiryMailto`, `buildDecapConfig`, and `createArtistRosterSearcher`.
- Browser-facing orchestration functions return `boolean` or `Promise<boolean>` when the caller needs to branch on success, as in `openShellSectionHref` and `restoreCachedShellPage` in `src/components/app-shell/AppShellRoot.tsx`.

## Module Design

**Exports:**
- Use named exports for library helpers and state primitives, as in `src/lib/app-shell/routing.ts`, `src/lib/admin/decap-config.ts`, `src/components/app-shell/player-session-machine.ts`, and `src/components/app-shell/player-session-ui.ts`.
- Use `export default` mainly for React components, as in `src/components/app-shell/AppShellRoot.tsx`, `src/components/services/ServicesInquiryForm.tsx`, and `src/components/artists/ArtistsRosterFilters.tsx`.
- Keep Astro page endpoints explicit with named `GET`, `getStaticPaths`, and `prerender` exports, as in `src/pages/admin/config.yml.ts`, `src/pages/admin/media/[collection]/[asset].ts`, and `src/pages/favicon.ico.ts`.

**Barrel Files:**
- Barrel files are not detected. Import modules directly from their owning file path.

## Shell And Admin-Specific Conventions

**Shell routing and player helpers:**
- Keep URL normalization and route parsing in `src/lib/app-shell/routing.ts`; keep DOM mutation, history coordination, and portal mounting in `src/components/app-shell/AppShellRoot.tsx`.
- Preserve the current split between pure player state helpers in `src/components/app-shell/player-session-machine.ts` and `src/components/app-shell/player-session-ui.ts` and imperative iframe/session handling in `src/components/app-shell/AppShellRoot.tsx`.
- Use `useRef` caches for mutable browser objects that must survive rerenders, as in `overlayCacheRef`, `shellPageCacheRef`, `iframeCacheByEmbedUrlRef`, and `providerSelectionByTitleRef` in `src/components/app-shell/AppShellRoot.tsx`.
- Use `useEffect` only for browser subscriptions and DOM synchronization. `src/components/app-shell/AppShellRoot.tsx` uses effects for body classes, portal targets, hero scroll sync, global click handling, `popstate`, and focus restoration.

**Decap config generation:**
- Keep YAML generation as a pure string builder in `src/lib/admin/decap-config.ts`; keep environment reads and content lookups in `src/pages/admin/config.yml.ts`.
- Model repeated YAML fragments with small builder helpers such as `buildField`, `buildListType`, `buildFileCollection`, and `buildFolderCollection` in `src/lib/admin/decap-config.ts`.
- Encode editor guidance directly in generated field hints and summaries, as shown throughout `src/lib/admin/decap-config.ts` for home sections, artist selection, and release metadata.

**CI verification:**
- Keep verification commands centralized in `package.json` and mirror them in `.github/workflows/pages.yml`.
- Any new behavior-level change should remain compatible with the current Pages gate: `pnpm test:unit`, `pnpm check`, and `pnpm build`.

---

*Convention analysis: 2026-04-06*
