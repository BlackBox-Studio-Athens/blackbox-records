import { readFile, readdir } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = true;

const contentTypes: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

export async function getStaticPaths() {
  const paths = [];
  for (const collection of ['distro', 'releases']) {
    const directory = resolve('src/content', collection);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const contentType = contentTypes[extname(entry.name).toLowerCase()];
      if (entry.isFile() && contentType) {
        paths.push({
          params: { collection, asset: entry.name },
          props: { assetPath: resolve(directory, entry.name), contentType },
        });
      }
    }
  }
  return paths;
}

// Only build-discovered files reach this static endpoint; URL input never becomes a filesystem path.
export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await readFile(props.assetPath)), {
    headers: { 'Content-Type': props.contentType },
  });
