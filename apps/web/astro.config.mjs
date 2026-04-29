// @ts-check

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

const site = process.env.ASTRO_SITE_URL?.trim() || 'https://blackbox-studio-athens.github.io';
const base = process.env.ASTRO_BASE_PATH?.trim() || '/blackbox-records/';

export default defineConfig({
  site,
  base,
  output: 'static',
  prefetch: {
    prefetchAll: false,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
