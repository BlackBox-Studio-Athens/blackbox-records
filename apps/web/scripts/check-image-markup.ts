import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

type ImageCheck = {
  className: string;
  minCount?: number;
  firstEagerCount?: number;
  minSrcsetCandidates?: number;
  requireDecoding?: boolean;
  requirePriority?: boolean;
  requireSrcset?: boolean;
};

type RouteCheck = {
  route: string;
  images: ImageCheck[];
  maxHighPriorityImages?: number;
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
    route: 'distro/index.html',
    maxHighPriorityImages: 0,
    images: [
      {
        className: 'distro-card__image',
        firstEagerCount: 3,
        minCount: 4,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'store/index.html',
    maxHighPriorityImages: 0,
    images: [
      {
        className: 'store-item-card__image',
        firstEagerCount: 3,
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
        minCount: 3,
        minSrcsetCandidates: 2,
        requireDecoding: true,
        requireSrcset: true,
      },
    ],
  },
  {
    route: 'store/disintegration-black-vinyl-lp/index.html',
    maxHighPriorityImages: 1,
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
    route: 'releases/disintegration/index.html',
    maxHighPriorityImages: 1,
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
  {
    route: 'artists/afterwise/index.html',
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
    route: 'news/lorem-ipsum/index.html',
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

function readAttribute(tag: string, name: string): string {
  return new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] || '';
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

export function checkImageMarkup(routeHtmlByPath: Map<string, string>, checks: RouteCheck[]): ImageMarkupDiagnostic[] {
  const diagnostics: ImageMarkupDiagnostic[] = [];

  for (const check of checks) {
    const html = routeHtmlByPath.get(check.route);
    if (!html) {
      diagnostics.push({ route: check.route, message: 'Route HTML is missing.' });
      continue;
    }

    if (check.maxHighPriorityImages !== undefined) {
      const highPriorityImages = [...html.matchAll(/<img\b[^>]*fetchpriority="high"[^>]*>/g)].length;
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
        if (image.requireSrcset && (!tag.includes(' srcset=') || !tag.includes(' sizes='))) {
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

        if (image.requirePriority && !tag.includes('loading="eager"')) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} is not eager.` });
        }

        if (image.requirePriority && !tag.includes('fetchpriority="high"')) {
          diagnostics.push({
            route: check.route,
            message: `${image.className} #${index + 1} lacks high fetch priority.`,
          });
        }

        if (image.firstEagerCount && index < image.firstEagerCount && !tag.includes('loading="eager"')) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} should be eager.` });
        }

        if (image.firstEagerCount && index >= image.firstEagerCount && !tag.includes('loading="lazy"')) {
          diagnostics.push({ route: check.route, message: `${image.className} #${index + 1} should stay lazy.` });
        }
      }
    }
  }

  return diagnostics;
}

function run() {
  const routeHtmlByPath = new Map<string, string>();

  for (const route of routeChecks.map((check) => check.route)) {
    const filePath = join(distRoot, route);
    if (existsSync(filePath)) {
      routeHtmlByPath.set(route, readFileSync(filePath, 'utf8'));
    }
  }

  const diagnostics = checkImageMarkup(routeHtmlByPath, routeChecks);
  const artistsHtml = routeHtmlByPath.get('artists/index.html') || '';
  const ouranopithecusTag = getImageTags(artistsHtml, 'artist-roster-card__image').find((tag) =>
    tag.includes('alt="Ouranopithecus"'),
  );
  const candidateUrl = ouranopithecusTag ? getSrcsetCandidateUrl(ouranopithecusTag, 480) : '';
  const candidatePath = candidateUrl ? join(distRoot, candidateUrl.replace(/^.*?\/_astro\//, '_astro/')) : '';
  if (!candidatePath || !existsSync(candidatePath)) {
    diagnostics.push({ route: 'artists/index.html', message: 'Ouranopithecus 480w candidate is missing.' });
  } else if (statSync(candidatePath).size > 100 * 1024) {
    diagnostics.push({
      route: 'artists/index.html',
      message: `Ouranopithecus 480w candidate exceeds 100 KiB (${statSync(candidatePath).size} bytes).`,
    });
  }
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
