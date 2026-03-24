// @ts-check

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blackbox-studio-athens.github.io',
  base: '/blackbox-records/',
  output: 'static',
  prefetch: {
    prefetchAll: false,
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
