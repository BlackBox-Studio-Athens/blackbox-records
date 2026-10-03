import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';

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
    maxHighPriorityImages: 1,
    images: [
      {
        className: 'news-card__image',
        firstPriorityCount: 1,
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
  return getSrcsetCandidates(tag).length;
}

export function getSrcsetCandidateUrl(tag: string, width: number): string {
  return getSrcsetCandidates(tag).find((candidate) => candidate.width === width)?.url || '';
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

/** A viewport the srcset selection check emulates: CSS width and device pixel ratio. */
export type ViewportProbe = { width: number; dpr: number };

export const srcsetViewportProbes: readonly ViewportProbe[] = [
  { width: 390, dpr: 2 },
  { width: 390, dpr: 3 },
  { width: 1440, dpr: 1 },
];

type SlotContext = { html: string; tag: string };

export type SrcsetSlotCheck = {
  /** A built page, or a pattern whose `*` matches one path segment; a pattern checks every matching page. */
  route: string;
  className: string;
  /**
   * The CSS px [min, max] the image paints at a probe viewport width, from global.css. `sizes` must not fall below
   * min, and the picked candidate must not exceed the one that covers max at the probe's pixel ratio.
   */
  slot: (viewportWidth: number, context: SlotContext) => readonly [number, number];
};

const rootFontSize = 16;

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const character of value) {
    if (character === '(') depth += 1;
    if (character === ')') depth -= 1;
    if (character === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Evaluates a CSS length (px, rem, em, vw, unitless 0) or a calc() of them, as `sizes` uses it, in CSS px. */
export function evaluateCssLength(expression: string, viewportWidth: number): number {
  const tokens = expression.match(/[\d.]+(?:px|rem|em|vw)?|calc|[()*/+-]/g) ?? [];
  let index = 0;
  const peek = () => tokens[index];
  const next = () => tokens[index++];

  function primary(): number {
    const token = next();
    if (token === 'calc') return primary();
    if (token === '(') {
      const value = sum();
      if (next() !== ')') throw new Error(`Unbalanced length: ${expression}`);
      return value;
    }
    if (token === '-') return -primary();
    const match = /^([\d.]+)(px|rem|em|vw)?$/.exec(token ?? '');
    if (!match) throw new Error(`Unsupported length: ${expression}`);
    const amount = Number(match[1]);
    if (match[2] === 'vw') return (amount * viewportWidth) / 100;
    if (match[2] === 'rem' || match[2] === 'em') return amount * rootFontSize;
    return amount;
  }
  function product(): number {
    let value = primary();
    while (peek() === '*' || peek() === '/') value = next() === '*' ? value * primary() : value / primary();
    return value;
  }
  function sum(): number {
    let value = product();
    while (peek() === '+' || peek() === '-') value = next() === '+' ? value + product() : value - product();
    return value;
  }

  const value = sum();
  if (index !== tokens.length) throw new Error(`Unsupported length: ${expression}`);
  return value;
}

function matchesMediaCondition(condition: string, viewportWidth: number): boolean {
  return condition.split(/\s+and\s+/).every((feature) => {
    const match = /^\(\s*(min|max)-width:\s*([^)]+)\)$/.exec(feature.trim());
    if (!match) throw new Error(`Unsupported sizes media condition: ${condition}`);
    const limit = evaluateCssLength(match[2]!, viewportWidth);
    return match[1] === 'min' ? viewportWidth >= limit : viewportWidth <= limit;
  });
}

/** The slot width in CSS px that a `sizes` attribute selects at a viewport width. */
export function evaluateSizes(sizes: string, viewportWidth: number): number {
  for (const entry of splitTopLevel(sizes)) {
    const match = /^((?:\([^()]*\)(?:\s+and\s+)?)+)\s+(\S.*)$/.exec(entry);
    if (!match) return evaluateCssLength(entry, viewportWidth);
    if (matchesMediaCondition(match[1]!, viewportWidth)) return evaluateCssLength(match[2]!, viewportWidth);
  }
  return viewportWidth;
}

/** `w` candidates of an img tag, narrowest first. */
export function getSrcsetCandidates(tag: string): { url: string; width: number }[] {
  // Commas inside direct Images URLs are options, not candidate separators.
  return [...readAttribute(tag, 'srcset').matchAll(/(?:^|,\s*)(\S+)\s+(\d+)w(?=\s*(?:,|$))/g)]
    .map(([, url, width]) => ({ url: url!, width: Number(width) }))
    .sort((left, right) => left.width - right.width);
}

/**
 * The candidate a browser fetches for a slot: the narrowest at least slot x pixel ratio wide, else the widest.
 * Chromium selects this way for these ladders, as the review's mobile traces showed.
 */
export function pickSrcsetCandidate(tag: string, slotWidth: number, dpr: number) {
  const candidates = getSrcsetCandidates(tag);
  return candidates.find((candidate) => candidate.width >= slotWidth * dpr) ?? candidates.at(-1);
}

export function checkSrcsetSelections(
  routeHtmlByPath: Map<string, string>,
  checks: readonly SrcsetSlotCheck[],
  probes: readonly ViewportProbe[] = srcsetViewportProbes,
): ImageMarkupDiagnostic[] {
  const diagnostics: ImageMarkupDiagnostic[] = [];

  for (const check of checks) {
    const pattern = routePatternToRegExp(check.route);
    const pages = [...routeHtmlByPath.entries()]
      .filter(([route, html]) => pattern.test(route) && getImageTags(html, check.className).length > 0)
      .sort(([left], [right]) => left.localeCompare(right));
    if (pages.length === 0) {
      diagnostics.push({ route: check.route, message: `No built page renders ${check.className}.` });
      continue;
    }

    for (const [route, html] of pages) {
      const tag = getImageTags(html, check.className)[0]!;
      const sizes = readAttribute(tag, 'sizes');
      for (const { width, dpr } of probes) {
        const probe = `${width}@${dpr}`;
        const [minSlot, maxSlot] = check.slot(width, { html, tag });
        const sizesWidth = evaluateSizes(sizes, width);
        if (sizesWidth < minSlot - 1) {
          diagnostics.push({
            route,
            message: `${check.className} sizes gives ${Math.round(sizesWidth)}px at ${probe}, below its ${Math.round(minSlot)}px slot.`,
          });
        }
        const picked = pickSrcsetCandidate(tag, sizesWidth, dpr);
        const enough = pickSrcsetCandidate(tag, maxSlot, dpr);
        if (picked && enough && picked.width > enough.width) {
          diagnostics.push({
            route,
            message: `${check.className} fetches ${picked.width}w at ${probe} where ${enough.width}w covers its ${Math.round(maxSlot)}px slot.`,
          });
        }
      }
    }
  }

  return diagnostics;
}

/** Painted width of an object-contain image in a frame, from the img tag's intrinsic width and height. */
function containedWidth(tag: string, frameWidth: number, frameHeight: number): number {
  const aspectRatio = Number(readAttribute(tag, 'width')) / Number(readAttribute(tag, 'height'));
  return aspectRatio > 0 ? Math.min(frameWidth, frameHeight * aspectRatio) : frameWidth;
}

const byViewport = (phone: readonly [number, number], desktop: readonly [number, number]) => (viewportWidth: number) =>
  viewportWidth < 640 ? phone : desktop;

/** First-viewport and card slots measured in Chromium at 390 and 1440 CSS px (global.css and the components). */
export const srcsetSlotChecks: SrcsetSlotCheck[] = [
  {
    route: 'releases/index.html',
    className: 'releases-latest-feature__artwork',
    // Includes the artwork's 1.026 resting scale; beside the upcoming release the feature spans 9 of 12 columns.
    slot: (viewportWidth, { html }) =>
      byViewport(
        [330, 336],
        html.includes('releases-page-layout--single-column') ? [617, 626] : [450, 458],
      )(viewportWidth),
  },
  {
    route: 'releases/*/index.html',
    className: 'release-detail-cover__image',
    // On desktop the cover stretches to the copy column's height with object-cover.
    slot: byViewport([356, 360], [447, 576]),
  },
  {
    route: 'news/*/index.html',
    className: 'news-detail-lead__image',
    slot: byViewport([298, 302], [1012, 1016]),
  },
  { route: 'news/index.html', className: 'news-card__image', slot: byViewport([356, 360], [347, 352]) },
  { route: 'index.html', className: 'news-card__image', slot: byViewport([356, 360], [345, 350]) },
  {
    route: 'artists/*/index.html',
    className: 'artist-detail-hero__image',
    // The photo is contained in a 16:13 frame (1.18:1 on desktop), so it paints narrower when portrait or square.
    slot: (viewportWidth, { tag }) => {
      const painted =
        viewportWidth < 640 ? containedWidth(tag, 356, 356 / (16 / 13)) : containedWidth(tag, 551, 551 / 1.18);
      return [painted, painted * 1.03 + 2];
    },
  },
];

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

/** Captured external candidates are local emulation artifacts; never fetch an image provider here. */
export function imageCandidateBytes(candidateUrl: string, assetsRoot: string, documentsRoot: string) {
  const url = new URL(candidateUrl, 'https://local.invalid');
  const marker = url.pathname.indexOf('/_astro/');
  const candidatePath =
    marker >= 0
      ? join(assetsRoot, url.pathname.slice(marker + 1))
      : join(documentsRoot, '.image-assets', `${createHash('sha256').update(candidateUrl).digest('hex')}.webp`);
  return existsSync(candidatePath) && statSync(candidatePath).isFile() ? statSync(candidatePath).size : undefined;
}

export function checkImageMarkupDirectory(documentsRoot: string, assetsRoot: string) {
  for (const [label, root] of [
    ['Document', documentsRoot],
    ['Client asset', assetsRoot],
  ]) {
    if (!existsSync(root!) || !statSync(root!).isDirectory()) throw new Error(`${label} directory is missing: ${root}`);
  }
  const routeHtmlByPath = new Map<string, string>();

  const routes = routeChecks.flatMap(({ route }) =>
    route.includes('*') ? listPatternRoutes(documentsRoot, route) : [route],
  );
  for (const route of routes) {
    const filePath = join(documentsRoot, route);
    if (existsSync(filePath)) {
      routeHtmlByPath.set(route, readFileSync(filePath, 'utf8'));
    }
  }

  return [
    ...checkImageMarkup(routeHtmlByPath, routeChecks),
    ...checkSrcsetSelections(routeHtmlByPath, srcsetSlotChecks),
    ...checkRosterPortraitBudgets(routeHtmlByPath.get('artists/index.html') || '', (candidateUrl) => {
      return imageCandidateBytes(candidateUrl, assetsRoot, documentsRoot);
    }),
  ];
}

function run() {
  const { values } = parseArgs({ options: { dist: { type: 'string' }, documents: { type: 'string' } } });
  const assetsRoot = resolve(values.dist ?? distRoot);
  const diagnostics = checkImageMarkupDirectory(resolve(values.documents ?? assetsRoot), assetsRoot);
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
