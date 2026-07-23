import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import type { APIRoute, GetStaticPaths } from 'astro';

import {
  decapCollectionMedia,
  decapCollectionMediaKeys,
  decapMediaCacheControl,
  getDecapMediaContentType,
  resolveDecapMediaAsset,
} from '@/lib/admin/decap-media';

export const prerender = true;

const notFoundResponse = () =>
  new Response('Media asset not found.\n', {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });

function resolveAppRoot(): string {
  const currentWorkingDirectory = process.cwd();
  const candidates = [currentWorkingDirectory, resolve(currentWorkingDirectory, 'apps/web')];

  for (const candidate of candidates) {
    if (existsSync(resolve(candidate, 'src/content/about'))) {
      return candidate;
    }
  }

  throw new Error('Unable to resolve the Astro app root for admin media assets.');
}

const appRoot = resolveAppRoot();

type ReadDecapMediaAsset = (absolutePath: string) => Promise<Uint8Array>;

export async function createDecapMediaResponse(input: {
  appRoot: string;
  asset: string | undefined;
  collection: string | undefined;
  readAsset?: ReadDecapMediaAsset;
}): Promise<Response> {
  const resolvedAsset = resolveDecapMediaAsset({
    appRoot: input.appRoot,
    asset: input.asset,
    collection: input.collection,
  });
  if (!resolvedAsset) return notFoundResponse();

  let fileBuffer: Uint8Array;
  try {
    fileBuffer = await (input.readAsset ?? readFile)(resolvedAsset.absolutePath);
  } catch {
    return notFoundResponse();
  }

  const responseBody = new Uint8Array(fileBuffer.byteLength);
  responseBody.set(fileBuffer);

  return new Response(responseBody.buffer, {
    headers: {
      'Cache-Control': decapMediaCacheControl,
      'Content-Type': resolvedAsset.contentType,
    },
  });
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];

  for (const collection of decapCollectionMediaKeys) {
    const absoluteDirectory = resolve(appRoot, decapCollectionMedia[collection].appDirectory);
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      if (!getDecapMediaContentType(entry.name)) {
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

export const GET: APIRoute = ({ params }) =>
  createDecapMediaResponse({
    appRoot,
    asset: params.asset,
    collection: params.collection,
  });
