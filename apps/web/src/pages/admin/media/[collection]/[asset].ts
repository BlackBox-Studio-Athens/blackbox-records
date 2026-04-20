import { readFile, readdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { APIRoute, GetStaticPaths } from 'astro';

export const prerender = true;

const collectionDirectories = {
  about: 'src/content/about',
  artists: 'src/content/artists',
  distro: 'src/content/distro',
  home: 'src/content/home',
  news: 'src/content/news',
  releases: 'src/content/releases',
  services: 'src/content/services',
} as const;

const imageExtensions = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp']);
const contentTypes = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
} as const;
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];

  for (const [collection, directory] of Object.entries(collectionDirectories)) {
    const absoluteDirectory = resolve(appRoot, directory);
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const extension = extname(entry.name).toLowerCase();
      if (!imageExtensions.has(extension)) {
        continue;
      }

      paths.push({
        params: {
          asset: entry.name,
          collection,
        },
      });
    }
  }

  return paths;
};

export const GET: APIRoute = async ({ params }) => {
  const collection = params.collection as keyof typeof collectionDirectories | undefined;
  const asset = params.asset;

  if (!collection || !asset) {
    return new Response(null, { status: 404 });
  }

  const directory = collectionDirectories[collection];
  if (!directory) {
    return new Response(null, { status: 404 });
  }

  const absoluteFilePath = resolve(appRoot, directory, asset);
  const extension = extname(asset).toLowerCase() as keyof typeof contentTypes;
  const fileBuffer = await readFile(absoluteFilePath);

  return new Response(new Uint8Array(fileBuffer), {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
    },
  });
};
