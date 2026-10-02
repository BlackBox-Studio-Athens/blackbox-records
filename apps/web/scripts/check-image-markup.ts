import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

type ImageCheck = {
  className: string;
  minCount?: number;
  firstEagerCount?: number;
  firstPriorityCount?: number;
  minSrcsetCandidates?: number;
  requireDecoding?: boolean;
  requirePriority?: boolean;
  requireSrcset?: boolean;
};

type RouteCheck = {
  /** A built page, or a pattern whose `*` matches one path segment (one detail page per content entry). */
  route: string;
  images: ImageCheck[];
  maxHighPriorityImages?: number;
  /**
   * Checks on the same pattern route that set this are alternatives, such as a detail page's single cover or gallery:
   * each one that resolves to a built page is checked, and the pattern fails only when none of them resolves.
   */
  alternative?: boolean;
};

type ImageMarkupDiagnostic = {
  message: string;
  route: string;
};

const distRoot = fileURLToPath(new URL('../dist', import.meta.url));

const routeChecks: RouteCheck[] = [
  {
    route: 'index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'homepage-hero-section__media-image',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'store/distro/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'store-item-card__image',
        firstPriorityCount: 1,
        firstEagerCount: 4,
        minCount: 4,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'store/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'store-item-card__image',
        firstPriorityCount: 1,
        firstEagerCount: 4,
        minCount: 4,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'artists/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'artist-roster-card__image',
        firstEagerCount: 3,
        minCount: 3,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'news/index.html',
    maxHighPriorityImages: 0,
    images: [
      {
        className: 'news-card__image',
        firstEagerCount: 1,
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'releases/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'releases-latest-feature__artwork',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
      {
        className: 'release-card-artwork',
        firstEagerCount: 3,
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'store/*/index.html',
    maxHighPriorityImages: 1,
    alternative: true,
    images: [
      {
        className: 'store-item-detail__image',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'releases/*/index.html',
    maxHighPriorityImages: 1,
    alternative: true,
    images: [
      {
        className: 'release-detail-cover__image',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
    ],
  },
  // A detail page renders either the single cover or a gallery, so each kind resolves to a page of its own.
  ...['store/*/index.html', 'releases/*/index.html'].map((route) => ({
    route,
    maxHighPriorityImages: 1,
    alternative: true,
    images: [
      {
        className: 'store-image-gallery__image',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
    ],
  })),
  {
    route: 'artists/*/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'artist-detail-hero__image',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
      {
        className: 'artist-latest-release-panel__artwork',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'news/*/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'news-detail-lead__image',
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'app-shell-overlay/releases/*/index.html',
    maxHighPriorityImages: 0,
    alternative: true,
    images: [
      {
        className: 'release-detail-cover__image',
        firstEagerCount: 1,
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'app-shell-overlay/releases/*/index.html',
    maxHighPriorityImages: 0,
    alternative: true,
    images: [
      {
        className: 'store-image-gallery__image',
        firstEagerCount: 1,
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'app-shell-overlay/artists/*/index.html',
    maxHighPriorityImages: 0,
    images: [
      {
        className: 'artist-detail-hero__image',
        firstEagerCount: 1,
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'app-shell-overlay/news/*/index.html',
    maxHighPriorityImages: 0,
    images: [
      {
        className: 'news-detail-lead__image',
        firstEagerCount: 1,
        minCount: 1,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'services/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'services-service-section__image',
        firstEagerCount: 1,
        minCount: 3,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'about/index.html',
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'internal-page-hero__image',
        minCount: 1,
        minSrcsetCandidates: 5,
        requireDecoding: true,
        requirePriority: true,
        requireSrcset: true,
      },
    ],
  },
];

export function getImageTags(html: string, className: string): string[] {
  return [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]).filter((tag) => tag.includes(className));
}

/** HTML attribute names are case-insensitive, and React server rendering keeps `srcSet` and `fetchPriority`. */
function readAttribute(tag: string, name: string): string {
  return new RegExp(`\\s${name}="([^"]*)"`, 'i').exec(tag)?.[1] || '';
}

function countHighPriorityImages(html: string): number {
  return [...html.matchAll(/<img\b[^>]*>/g)].filter((match) => readAttribute(match[0], 'fetchpriority') === 'high')
    .length;
}

function countSrcsetCandidates(tag: string): number {
  return readAttribute(tag, 'srcset')
    .split(',')
    .map((candidate) => candidate.trim())
    .filter(Boolean).length;
}

export function getSrcsetCandidateUrl(tag: string, width: number): string {
  const candidate = readAttribute(tag, 'srcset')
    .split(',')
    .map((value) => value.trim().split(/\s+/))
    .find(([, descriptor]) => descriptor === `${width}w`);
  return candidate?.[0] || '';
}

/** Every roster item with its portrait tag ('' when missing). The blurred `.artist-photo-fill` copy is not a portrait. */
export function getArtistRosterPortraits(html: string): { artistTitle: string; tag: string }[] {
  const itemOpenTags = [...html.matchAll(/<div\b[^>]*\bdata-artist-roster-item\b[^>]*>/g)];

  return itemOpenTags.map((match, index) => ({
    artistTitle: readAttribute(match[0], 'data-artist-title'),
    tag:
      getImageTags(
        html.slice(match.index, itemOpenTags[index + 1]?.index ?? html.length),
        'artist-roster-card__image',
      )[0] || '',
  }));
}

export const rosterPortraitBudgetBytes = 100 * 1024;

/**
 * Editors add, rename and withdraw artists, so the budget applies to the 480w candidate of every roster portrait.
 * `sizeOf` returns the candidate file's byte size, or undefined when the file is missing.
 */
export function checkRosterPortraitBudgets(
  html: string,
  sizeOf: (candidateUrl: string) => number | undefined,
): ImageMarkupDiagnostic[] {
  const route = 'artists/index.html';
  const portraits = getArtistRosterPortraits(html);
  if (portraits.length === 0) return [{ route, message: 'No artist roster portraits rendered.' }];

  return portraits.flatMap(({ artistTitle, tag }) => {
    const artist = artistTitle || 'Untitled artist';
    if (!tag) return [{ route, message: `${artist} roster portrait is missing.` }];
    const candidateUrl = getSrcsetCandidateUrl(tag, 480);
    const size = candidateUrl ? sizeOf(candidateUrl) : undefined;
    if (size === undefined)
      return [{ route, message: `${artist} 480w candidate is missing (${candidateUrl || 'none in srcset'}).` }];
    if (size > rosterPortraitBudgetBytes) {
      return [{ route, message: `${artist} 480w candidate exceeds 100 KiB (${size} bytes, ${candidateUrl}).` }];
    }
    return [];
  });
}

function routePatternToRegExp(pattern: string): RegExp {
  return new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[^/]+')}$`);
}

/**
 * Detail pages come from editorial content, which editors may withdraw or reshape (for example a gallery
 * replaces the single cover image). A pattern route therefore checks the first built page, in sorted order,
 * that renders every checked image class, instead of a hard-coded slug.
 */
function resolveRepresentativeRoute(routeHtmlByPath: Map<string, string>, check: RouteCheck): RouteCheck | undefined {
  if (!check.route.includes('*')) return check;

  const pattern = routePatternToRegExp(check.route);
  const route = [...routeHtmlByPath.keys()]
    .filter((candidate) => pattern.test(candidate))
    .sort()
    .find((candidate) => {
      const html = routeHtmlByPath.get(candidate) || '';
      return check.images.every((image) => getImageTags(html, image.className).length >= (image.minCount ?? 1));
    });
  return route ? { ...check, route } : undefined;
}

function listPatternRoutes(root: string, pattern: string): string[] {
  const [prefix = '', suffix = ''] = pattern.split('*');
  const directory = join(root, prefix);
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${prefix}${entry.name}${suffix}`)
    .filter((route) => existsSync(join(root, route)));
}

export function checkImageMarkup(routeHtmlByPath: Map<string, string>, checks: RouteCheck[]): ImageMarkupDiagnostic[] {
  const diagnostics: ImageMarkupDiagnostic[] = [];
  const describe = (routeCheck: RouteCheck) => routeCheck.images.map((image) => image.className).join(' and ');
  const unresolvedAlternatives = new Map<string, RouteCheck[]>();
  const resolvedAlternatives = new Set<string>();

  for (const routeCheck of checks) {
    const check = resolveRepresentativeRoute(routeHtmlByPath, routeCheck);
    if (routeCheck.alternative) {
      if (check) resolvedAlternatives.add(routeCheck.route);
      else
        unresolvedAlternatives.set(routeCheck.route, [
          ...(unresolvedAlternatives.get(routeCheck.route) ?? []),
          routeCheck,
        ]);
    }
    if (!check) {
      if (routeCheck.alternative) continue;
      diagnostics.push({ route: routeCheck.route, message: `No built page renders ${describe(routeCheck)}.` });
      continue;
    }
    const html = routeHtmlByPath.get(check.route);
    if (!html) {
      diagnostics.push({ route: check.route, message: 'Route HTML is missing.' });
      continue;
    }

    if (check.maxHighPriorityImages !== undefined) {
      const highPriorityImages = countHighPriorityImages(html);
      if (highPriorityImages > check.maxHighPriorityImages) {
        diagnostics.push({
          route: check.route,
          message: `Expected at most ${check.maxHighPriorityImages} high-priority image(s), found ${highPriorityImages}.`,
        });
      }
    }

    for (const image of check.images) {
      const tags = getImageTags(html, image.className);
      if (tags.length < (image.minCount ?? 1)) {
        diagnostics.push({ route: check.route, message: `${image.className} found ${tags.length} time(s).` });
        continue;
      }

      for (const [index, tag] of tags.entries()) {
        const eager = readAttribute(tag, 'loading') === 'eager';
        const lazy = readAttribute(tag, 'loading') === 'lazy';
        const highPriority = readAttribute(tag, 'fetchpriority') === 'high';
        if (image.requireSrcset && (!readAttribute(tag, 'srcset') || !readAttribute(tag, 'sizes'))) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} lacks srcset/sizes.` });
        }

        if (image.minSrcsetCandidates && countSrcsetCandidates(tag) < image.minSrcsetCandidates) {
          diagnostics.push({
            route: check.route,
            message: `${image.className} #${index + 1} has fewer than ${image.minSrcsetCandidates} srcset candidates.`,
          });
        }

        if (image.requireDecoding && !readAttribute(tag, 'decoding')) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} lacks decoding.` });
        }

        if (image.requirePriority && !eager) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} is not eager.` });
        }

        if (image.requirePriority && !highPriority) {
          diagnostics.push({
            route: check.route,
            message: `${image.className} #${index + 1} lacks high fetch priority.`,
          });
        }

        if (image.firstPriorityCount && index < image.firstPriorityCount && !eager) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} should be eager.` });
        }

        if (image.firstPriorityCount && index < image.firstPriorityCount && !highPriority) {
          diagnostics.push({
            route: check.route,
            message: `${image.className} #${index + 1} should have high fetch priority.`,
          });
        }

        if (image.firstPriorityCount && !image.firstEagerCount && index >= image.firstPriorityCount && !lazy) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} should stay lazy.` });
        }

        if (image.firstPriorityCount && index >= image.firstPriorityCount && highPriority) {
          diagnostics.push({
            route: check.route,
            message: `${image.className} #${index + 1} should not have high fetch priority.`,
          });
        }

        if (image.firstEagerCount && index < image.firstEagerCount && !eager) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} should be eager.` });
        }

        if (image.firstEagerCount && index >= image.firstEagerCount && !lazy) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} should stay lazy.` });
        }
      }
    }
  }

  for (const [route, alternatives] of unresolvedAlternatives) {
    if (resolvedAlternatives.has(route)) continue;
    diagnostics.push({ route, message: `No built page renders ${alternatives.map(describe).join(' or ')}.` });
  }

  return diagnostics;
}

function run() {
  const routeHtmlByPath = new Map<string, string>();

  const routes = routeChecks.flatMap(({ route }) =>
    route.includes('*') ? listPatternRoutes(distRoot, route) : [route],
  );
  for (const route of routes) {
    const filePath = join(distRoot, route);
    if (existsSync(filePath)) {
      routeHtmlByPath.set(route, readFileSync(filePath, 'utf8'));
    }
  }

  const diagnostics = [
    ...checkImageMarkup(routeHtmlByPath, routeChecks),
    ...checkRosterPortraitBudgets(routeHtmlByPath.get('artists/index.html') || '', (candidateUrl) => {
      const candidatePath = join(distRoot, candidateUrl.replace(/^.*?\/_astro\//, '_astro/'));
      return existsSync(candidatePath) ? statSync(candidatePath).size : undefined;
    }),
  ];
  if (diagnostics.length > 0) {
    console.error('Generated image markup validation failed.');
    for (const diagnostic of diagnostics) {
      console.error(`[image-markup] ${diagnostic.route} - ${diagnostic.message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Generated image markup validation passed.');
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  run();
}
