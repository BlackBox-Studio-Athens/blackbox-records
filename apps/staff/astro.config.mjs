// @ts-check

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://staff.blackboxrecordsathens.com',
  base: '/',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
