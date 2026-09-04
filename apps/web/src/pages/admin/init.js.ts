import type { APIRoute } from 'astro';
import { build } from 'esbuild';
import { resolve } from 'node:path';

export const prerender = true;

export const GET: APIRoute = async () => {
  const result = await build({
    entryPoints: [resolve('src/lib/admin/entry.js')],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    write: false,
  });
  const output = result.outputFiles[0];
  if (!output) {
    throw new Error('CMS bootstrap bundle is missing.');
  }
  return new Response(output.text, {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
  });
};
