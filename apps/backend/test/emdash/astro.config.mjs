import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { d1, r2 } from '@emdash-cms/cloudflare';
import { defineConfig } from 'astro/config';
import emdash from 'emdash/astro';
import { fileURLToPath } from 'node:url';

const localPath = (name) => fileURLToPath(new URL(name, import.meta.url)).replaceAll('\\', '/');

export default defineConfig({
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  vite: { build: { rolldownOptions: { output: { strictExecutionOrder: true } } } },
  integrations: [
    react(),
    emdash({
      database: d1({ binding: 'CMS_DB' }),
      storage: r2({ binding: 'MEDIA' }),
      migrations: { runtime: 'check', dev: 'auto' },
      auth: { type: 'blackbox-access', entrypoint: localPath('../../src/cms/auth.ts'), config: {} },
      plugins: [
        {
          id: 'revision-race-check',
          version: '0.0.1',
          format: 'standard',
          capabilities: ['content:write'],
          entrypoint: localPath('race-plugin.ts'),
        },
      ],
    }),
    {
      name: 'emdash-rest-contract',
      hooks: {
        'astro:config:setup': ({ injectRoute }) => {
          injectRoute({
            pattern: '/_emdash/api/openapi.json',
            entrypoint: 'emdash/routes/api/openapi.json',
            prerender: false,
          });
          injectRoute({
            pattern: '/_emdash/api/schema/render-parity',
            entrypoint: localPath('render-parity.astro'),
            prerender: false,
          });
        },
      },
    },
  ],
});
