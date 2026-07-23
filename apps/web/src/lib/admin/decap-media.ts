import { extname, isAbsolute, relative, resolve } from 'node:path';

export const decapCollectionMedia = {
  about: {
    appDirectory: 'src/content/about',
    mediaFolder: '.',
    publicFolder: './',
    repositoryDirectory: 'apps/web/src/content/about',
  },
  artists: {
    appDirectory: 'src/content/artists',
    mediaFolder: '.',
    publicFolder: './',
    repositoryDirectory: 'apps/web/src/content/artists',
  },
  distro: {
    appDirectory: 'src/content/distro',
    mediaFolder: '.',
    publicFolder: './',
    repositoryDirectory: 'apps/web/src/content/distro',
  },
  home: {
    appDirectory: 'src/content/home',
    mediaFolder: '.',
    publicFolder: './',
    repositoryDirectory: 'apps/web/src/content/home',
  },
  news: {
    appDirectory: 'src/content/news',
    mediaFolder: '.',
    publicFolder: './',
    repositoryDirectory: 'apps/web/src/content/news',
  },
  releases: {
    appDirectory: 'src/content/releases',
    mediaFolder: '.',
    publicFolder: './',
    repositoryDirectory: 'apps/web/src/content/releases',
  },
  services: {
    appDirectory: 'src/content/services',
    mediaFolder: '.',
    publicFolder: './',
    repositoryDirectory: 'apps/web/src/content/services',
  },
} as const;

export type DecapCollectionMediaKey = keyof typeof decapCollectionMedia;

export const decapCollectionMediaKeys = Object.freeze(Object.keys(decapCollectionMedia) as DecapCollectionMediaKey[]);

// Decap requires a global media_folder even when every image widget uses its
// collection override. The top-level Media action is hidden by the pinned
// runtime repair, so this accepted collection root is an inert fallback.
export const decapGlobalMedia = {
  mediaFolder: decapCollectionMedia.home.repositoryDirectory,
  publicFolder: decapCollectionMedia.home.publicFolder,
  topLevelLibrary: 'hidden',
} as const;

export const decapMediaContentTypes = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
} as const;

export type DecapMediaExtension = keyof typeof decapMediaContentTypes;

export const decapMediaExtensions = Object.freeze(Object.keys(decapMediaContentTypes) as DecapMediaExtension[]);
export const decapMediaCacheControl = 'public, max-age=0, must-revalidate';

export type ResolvedDecapMediaAsset = {
  absolutePath: string;
  asset: string;
  collection: DecapCollectionMediaKey;
  contentType: (typeof decapMediaContentTypes)[DecapMediaExtension];
};

function hasCollectionKey(value: string): value is DecapCollectionMediaKey {
  return Object.prototype.hasOwnProperty.call(decapCollectionMedia, value);
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
}

export function decodeDecapMediaSegment(value: string | undefined): string | null {
  if (!value) return null;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value).normalize('NFC');
  } catch {
    return null;
  }

  if (
    !decoded ||
    decoded === '.' ||
    decoded === '..' ||
    decoded.includes('/') ||
    decoded.includes('\\') ||
    hasControlCharacter(decoded) ||
    /%[0-9a-f]{2}/i.test(decoded)
  ) {
    return null;
  }

  return decoded;
}

export function getDecapMediaContentType(asset: string): ResolvedDecapMediaAsset['contentType'] | null {
  const extension = extname(asset).toLowerCase() as DecapMediaExtension;
  return decapMediaContentTypes[extension] ?? null;
}

export function resolveDecapMediaAsset(input: {
  appRoot: string;
  asset: string | undefined;
  collection: string | undefined;
}): ResolvedDecapMediaAsset | null {
  const collection = decodeDecapMediaSegment(input.collection);
  const asset = decodeDecapMediaSegment(input.asset);
  if (!collection || !hasCollectionKey(collection) || !asset) return null;

  const contentType = getDecapMediaContentType(asset);
  if (!contentType) return null;

  const allowedDirectory = resolve(input.appRoot, decapCollectionMedia[collection].appDirectory);
  const absolutePath = resolve(allowedDirectory, asset);
  const relativePath = relative(allowedDirectory, absolutePath);

  if (!relativePath || isAbsolute(relativePath) || relativePath.startsWith('..') || relativePath !== asset) {
    return null;
  }

  return { absolutePath, asset, collection, contentType };
}
