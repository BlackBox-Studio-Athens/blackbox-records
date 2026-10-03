// @ts-check

/**
 * Review drafts that must never ship: Astro ignores the `_demo` directory for file-based routing, and this
 * integration injects these pages only while `astro dev` runs. Production builds (the static site and the hosted
 * renderer, which shares `src/pages`) therefore contain no demo HTML and none of the demo-only assets.
 */
export const demoRoutes = [
  { pattern: '/demo/header-type-studies', entrypoint: new URL('./header-type-studies.astro', import.meta.url) },
  { pattern: '/demo/release-feature-drafts', entrypoint: new URL('./release-feature-drafts.astro', import.meta.url) },
];

/** @returns {import('astro').AstroIntegration} */
export function devDemoRoutes() {
  return {
    name: 'blackbox-dev-demo-routes',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        for (const route of demoRoutes) injectRoute(route);
      },
    },
  };
}
