import { mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { chromium, type Browser, type BrowserContext, type Page, type Request } from 'playwright';

import { reservedStoreRouteSegments } from '../apps/web/src/lib/store-categories';
import {
  appendSmokeStepSummary,
  createRouteUrl,
  createRunId,
  createSmokeEvidencePath,
  createSmokeScenarioArtifactDir,
  createSmokeSummaryPath,
  normalizeBaseUrl,
  parseNamedSmokeScenarioSelection,
  parsePositiveInteger,
  parseRequiredValue,
  parseScreenshotMode,
  publicSmokeRoutes,
  type RepresentativePaths,
  redactSensitiveSmokeText,
  scanHighRiskSmokeExposure,
  truncateForConsole,
  writeJsonFile,
} from './smoke-core';
import { attachSmokePageDiagnostics, captureSmokePageScreenshot, probeSmokeRoute } from './smoke-browser';

export type UatStaticSmokeScenarioName = 'public_assets' | 'checkout_shell' | 'public_routes' | 'image_transform';
export type UatStaticSmokeScenarioSelection = UatStaticSmokeScenarioName | 'all';

export type UatStaticSmokeOptions = {
  evidenceDir: string;
  headed: boolean;
  scenario: UatStaticSmokeScenarioSelection;
  screenshots: 'always' | 'never' | 'on-failure';
  siteUrl: string;
  timeoutMs: number;
};

type UatStaticSmokeCheckKind = 'binary-asset' | 'page' | 'text-asset';

type UatStaticSmokeCheck = {
  bodyTextSnippet: string | null;
  contentType: string | null;
  issues: string[];
  kind: UatStaticSmokeCheckKind;
  path: string;
  status: number | null;
  expectedStatus?: number;
  title: string | null;
  url: string;
};

export type UatStaticSmokeEvidence = {
  authenticated: false;
  checks: UatStaticSmokeCheck[];
  consoleErrors: string[];
  environment: 'uat';
  generatedAt: string;
  pageErrors: string[];
  readOnly: true;
  scenario: UatStaticSmokeScenarioName;
  screenshotPath: string | null;
  siteUrl: string;
  status: 'failed' | 'passed';
  summary: string;
  suite: 'uat-static';
};

type UatStaticSmokeScenarioDefinition = {
  description: string;
  name: UatStaticSmokeScenarioName;
};

type UatStaticSmokeSummary = {
  environment: 'uat';
  failedScenarioCount: number;
  generatedAt: string;
  passedScenarioCount: number;
  runId: string;
  scenarioNames: UatStaticSmokeScenarioName[];
  siteUrl: string;
  status: 'failed' | 'passed';
  suite: 'uat-static';
};

export type UatStaticSmokeEvidenceInput = {
  checks: UatStaticSmokeCheck[];
  consoleErrors: string[];
  pageErrors: string[];
  scenario: UatStaticSmokeScenarioDefinition;
  screenshotPath: string | null;
  siteUrl: string;
  status: UatStaticSmokeEvidence['status'];
};

const defaultSiteUrl = 'https://blackbox-records-web-uat.pages.dev';
const defaultEvidenceDir = path.join('.codex-artifacts', 'smoke', 'uat', 'uat-static');
const reviewSiteMarkerTexts = [
  'UAT · TESTING ONLY',
  'Data here is separate and does not transfer to or from the production site.',
  'Open production site',
] as const;
const reviewSiteTitlePrefix = '[UAT] ';
const reviewSiteCheckoutWarning = 'Test checkout. No real payment will be taken.';

const allScenarioNames: readonly UatStaticSmokeScenarioName[] = [
  'public_assets',
  'checkout_shell',
  'public_routes',
  'image_transform',
];
// `all` is the release smoke set. image_transform runs by name, e.g. against a new public hostname at cutover.
const releaseScenarioNames: readonly UatStaticSmokeScenarioName[] = [
  'public_assets',
  'checkout_shell',
  'public_routes',
];
// A 480 px AVIF or WebP of a content photo is tens of kilobytes; an original is hundreds or more.
export const imageTransformByteBudget = 250 * 1024;

const UAT_STATIC_SMOKE_SCENARIOS: Record<UatStaticSmokeScenarioName, UatStaticSmokeScenarioDefinition> = {
  public_assets: {
    description: 'Verify public media and secret exposure scanning.',
    name: 'public_assets',
  },
  checkout_shell: {
    description: 'Verify the native checkout shell route without creating provider state.',
    name: 'checkout_shell',
  },
  public_routes: {
    description: 'Verify the public routes, sitemap, and robots output.',
    name: 'public_routes',
  },
  image_transform: {
    description: 'Verify that /_image?w=480 returns a small, immutable AVIF or WebP transformation of public media.',
    name: 'image_transform',
  },
};

export function parseUatStaticSmokeArgs(args: string[]): UatStaticSmokeOptions {
  const options: UatStaticSmokeOptions = {
    evidenceDir: defaultEvidenceDir,
    headed: false,
    scenario: 'all',
    screenshots: 'on-failure',
    siteUrl: defaultSiteUrl,
    timeoutMs: 60_000,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm smoke:uat-static -- --site-url <url> --scenario public_assets|checkout_shell|public_routes|image_transform|all [--timeout-ms <ms>] [--evidence-dir <dir>] [--screenshots on-failure|always|never] [--headed]',
      );
      process.exit(0);
    }

    if (arg === '--site-url') {
      options.siteUrl = normalizeBaseUrl(parseRequiredValue('--site-url', args[index + 1]), '--site-url');
      index += 1;
      continue;
    }

    if (arg?.startsWith('--site-url=')) {
      options.siteUrl = normalizeBaseUrl(
        parseRequiredValue('--site-url', arg.slice('--site-url='.length)),
        '--site-url',
      );
      continue;
    }

    if (arg === '--scenario') {
      options.scenario = parseNamedSmokeScenarioSelection(args[index + 1], allScenarioNames, 'UAT static smoke');
      index += 1;
      continue;
    }

    if (arg?.startsWith('--scenario=')) {
      options.scenario = parseNamedSmokeScenarioSelection(
        arg.slice('--scenario='.length),
        allScenarioNames,
        'UAT static smoke',
      );
      continue;
    }

    if (arg === '--timeout-ms') {
      options.timeoutMs = parsePositiveInteger(args[index + 1], '--timeout-ms');
      index += 1;
      continue;
    }

    if (arg?.startsWith('--timeout-ms=')) {
      options.timeoutMs = parsePositiveInteger(arg.slice('--timeout-ms='.length), '--timeout-ms');
      continue;
    }

    if (arg === '--evidence-dir') {
      options.evidenceDir = parseRequiredValue('--evidence-dir', args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--evidence-dir=')) {
      options.evidenceDir = parseRequiredValue('--evidence-dir', arg.slice('--evidence-dir='.length));
      continue;
    }

    if (arg === '--screenshots') {
      options.screenshots = parseScreenshotMode(args[index + 1]);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--screenshots=')) {
      options.screenshots = parseScreenshotMode(arg.slice('--screenshots='.length));
      continue;
    }

    if (arg === '--headed') {
      options.headed = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

export function checkReviewSiteMarker(bodyText: string, documentTitle: string | null, routePath: string): string[] {
  const issues = reviewSiteMarkerTexts
    .filter((text) => !bodyText.includes(text))
    .map((text) => `Expected ${routePath} to include Review Site Marker text "${text}".`);

  if (!documentTitle?.startsWith(reviewSiteTitlePrefix)) {
    issues.push(`Expected ${routePath} document title to start with "${reviewSiteTitlePrefix}".`);
  }

  return issues;
}

export function resolveSelectedUatStaticSmokeScenarios(
  selection: UatStaticSmokeScenarioSelection,
): UatStaticSmokeScenarioDefinition[] {
  return selection === 'all'
    ? releaseScenarioNames.map((name) => UAT_STATIC_SMOKE_SCENARIOS[name])
    : [UAT_STATIC_SMOKE_SCENARIOS[selection]];
}

export async function runUatStaticSmoke(
  options: UatStaticSmokeOptions,
): Promise<{ evidence: UatStaticSmokeEvidence[]; runArtifactDir: string }> {
  const scenarios = resolveSelectedUatStaticSmokeScenarios(options.scenario);
  const evidence: UatStaticSmokeEvidence[] = [];
  const runId = createRunId();
  const runArtifactDir = path.join(options.evidenceDir, runId);

  mkdirSync(runArtifactDir, { recursive: true });

  const browser = await chromium.launch({
    headless: !options.headed,
  });

  try {
    for (const scenario of scenarios) {
      const result = await runUatStaticSmokeScenario({
        browser,
        options,
        runArtifactDir,
        scenario,
      });
      evidence.push(result);
    }
  } finally {
    await browser.close();
  }

  const summary: UatStaticSmokeSummary = {
    environment: 'uat',
    failedScenarioCount: evidence.filter((item) => item.status === 'failed').length,
    generatedAt: new Date().toISOString(),
    passedScenarioCount: evidence.filter((item) => item.status === 'passed').length,
    runId,
    scenarioNames: scenarios.map((scenario) => scenario.name),
    siteUrl: options.siteUrl,
    status: evidence.some((item) => item.status === 'failed') ? 'failed' : 'passed',
    suite: 'uat-static',
  };

  writeJsonFile(createSmokeSummaryPath(runArtifactDir), summary);

  return { evidence, runArtifactDir };
}

async function runUatStaticSmokeScenario(input: {
  browser: Browser;
  options: UatStaticSmokeOptions;
  runArtifactDir: string;
  scenario: UatStaticSmokeScenarioDefinition;
}): Promise<UatStaticSmokeEvidence> {
  const scenarioArtifactDir = createSmokeScenarioArtifactDir(input.runArtifactDir, input.scenario.name);
  mkdirSync(scenarioArtifactDir, { recursive: true });
  let context: BrowserContext | null = null;
  let diagnostics: { consoleErrors: string[]; dispose: () => void; pageErrors: string[] } | null = null;

  try {
    context = await input.browser.newContext({
      locale: 'en-US',
      viewport: { height: 900, width: 1280 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(input.options.timeoutMs);
    diagnostics = attachSmokePageDiagnostics(page);

    const checks =
      input.scenario.name === 'checkout_shell'
        ? [await checkCheckoutShellPage(page, input.options)]
        : input.scenario.name === 'public_assets'
          ? await checkPublicAssets(input.options, await discoverUatStaticCandidates(input.options))
          : input.scenario.name === 'image_transform'
            ? await checkImageTransform(input.options)
            : await checkPublicRoutes(
                page,
                input.options,
                firstRepresentativePaths(await discoverUatStaticCandidates(input.options)),
              );

    const consoleErrors = diagnostics.consoleErrors.slice();
    const pageErrors = diagnostics.pageErrors.slice();
    const hasIssuesBeforeScreenshot =
      checks.some((check) => check.issues.length || check.status !== (check.expectedStatus ?? 200)) ||
      consoleErrors.length > 0 ||
      pageErrors.length > 0;
    const screenshotPath =
      input.scenario.name === 'public_assets' || input.scenario.name === 'image_transform'
        ? null
        : await maybeCaptureStaticSmokeScreenshot(
            page,
            scenarioArtifactDir,
            hasIssuesBeforeScreenshot,
            input.options.screenshots,
          ).catch((error: unknown) => {
            pageErrors.push(
              `Screenshot capture failed: ${redactSensitiveSmokeText(truncateForConsole(String(error)))}.`,
            );
            return null;
          });
    const hasIssues =
      checks.some((check) => check.issues.length || check.status !== (check.expectedStatus ?? 200)) ||
      consoleErrors.length > 0 ||
      pageErrors.length > 0;
    const status = hasIssues ? 'failed' : 'passed';
    const summary = buildUatStaticSmokeSummary(
      input.scenario.name,
      input.scenario.description,
      checks,
      consoleErrors,
      pageErrors,
      status,
    );
    const evidence = buildUatStaticSmokeEvidence({
      checks,
      consoleErrors,
      pageErrors,
      scenario: input.scenario,
      screenshotPath,
      siteUrl: input.options.siteUrl,
      status,
    });

    writeJsonFile(createSmokeEvidencePath(scenarioArtifactDir), evidence);

    console.log(summary);

    return evidence;
  } catch (error) {
    const message = redactSensitiveSmokeText(
      truncateForConsole(error instanceof Error ? error.stack || error.message : String(error)),
    );
    const evidence = buildUatStaticSmokeEvidence({
      checks: [],
      consoleErrors: [message],
      pageErrors: [],
      scenario: input.scenario,
      screenshotPath: null,
      siteUrl: input.options.siteUrl,
      status: 'failed',
    });

    writeJsonFile(createSmokeEvidencePath(scenarioArtifactDir), evidence);
    console.log(evidence.summary);

    return evidence;
  } finally {
    diagnostics?.dispose();
    await context?.close();
  }
}

async function checkCheckoutShellPage(page: Page, options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck> {
  const url = createRouteUrl(options.siteUrl, '/store/checkout/');
  const probe = await probeSmokeRoute(page, url, options.timeoutMs);
  const issues = [...probe.issues];

  if (!probe.status || probe.status >= 400) {
    issues.push(`Expected checkout shell route to return HTTP 200; received ${probe.status ?? 'no response'}.`);
  }

  for (const expectedText of ['Checkout', 'Review and Pay', 'Order Summary']) {
    if (!containsTextIgnoreCase(probe.bodyText, expectedText)) {
      issues.push(`Expected the checkout shell to include "${expectedText}".`);
    }
  }

  issues.push(...checkReviewSiteMarker(probe.bodyText, probe.title, '/store/checkout/'));

  if (probe.bodyText.includes(reviewSiteCheckoutWarning)) {
    issues.push('Expected the empty checkout shell to hide the final-action test-payment warning.');
  }

  if (/checkout\.stripe\.com/i.test(probe.bodyText)) {
    issues.push('Checkout shell should not expose a hosted Checkout URL in the static shell copy.');
  }

  for (const exposure of scanHighRiskSmokeExposure(probe.bodyText)) {
    issues.push(`Checkout shell exposed ${exposure}.`);
  }

  return {
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(probe.bodyText), 500),
    contentType: null,
    issues,
    kind: 'page',
    path: '/store/checkout/',
    status: probe.status,
    title: probe.title,
    url,
  };
}

async function checkPublicAssets(
  options: UatStaticSmokeOptions,
  candidates: RepresentativeCandidates,
): Promise<UatStaticSmokeCheck[]> {
  const read = async (route: string) => {
    const response = await fetchSmokeResponse(createRouteUrl(options.siteUrl, route), options.timeoutMs);
    if (!response.ok) throw new Error('Public media source page did not return HTTP 200: ' + route);
    return response.text();
  };
  const checks: UatStaticSmokeCheck[] = [];
  checks.push(await checkBinaryAsset(options, '/favicon.svg', 'image/'));
  checks.push(await checkBinaryAsset(options, findPublicMediaPath(await read('/'), options.siteUrl), 'image/'));
  for (const section of ['artist', 'release', 'storeItem', 'news'] as const) {
    const mediaPath = await findSectionMediaPath(section, candidates[section], read, options.siteUrl);
    checks.push(await checkBinaryAsset(options, mediaPath, 'image/'));
  }
  return checks;
}

async function checkImageTransform(options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck[]> {
  const home = await fetchSmokeResponse(createRouteUrl(options.siteUrl, '/'), options.timeoutMs);
  if (!home.ok) throw new Error(`Image transform source page did not return HTTP 200: ${home.status}.`);
  const { mediaPath, transformPath } = imageTransformProbePaths(await home.text(), options.siteUrl);
  const url = createRouteUrl(options.siteUrl, transformPath);
  const issues: string[] = [];
  const response = await fetchSmokeResponse(url, options.timeoutMs, { Accept: 'image/avif,image/webp,*/*' });
  const bytes = (await response.arrayBuffer()).byteLength;
  const original = await fetchSmokeResponse(createRouteUrl(options.siteUrl, mediaPath), options.timeoutMs);
  const originalBytes = (await original.arrayBuffer()).byteLength;
  issues.push(
    ...imageTransformIssues({
      bytes,
      cacheControl: response.headers.get('cache-control'),
      contentType: response.headers.get('content-type'),
      fallback: response.headers.get('x-blackbox-image'),
      originalBytes: original.ok ? originalBytes : null,
      status: response.status,
    }),
  );
  return [
    {
      bodyTextSnippet: `${bytes} bytes transformed; original ${original.ok ? `${originalBytes} bytes` : `HTTP ${original.status}`}`,
      contentType: response.headers.get('content-type'),
      issues,
      kind: 'binary-asset',
      path: transformPath,
      status: response.status,
      title: null,
      url,
    },
  ];
}

/** The 480 px transformation request for the first published CMS image a page renders in `<main>`. */
export function imageTransformProbePaths(html: string, siteUrl: string) {
  const root = new URL(createRouteUrl(siteUrl));
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? '';
  for (const [, , source] of main.matchAll(/<img\b[^>]*\ssrc=(["'])(.*?)\1/gi)) {
    const rendered = new URL(source!.replaceAll('&amp;', '&'), root);
    const directSource =
      rendered.origin === 'https://images.blackboxrecordsathens.com'
        ? /^\/cdn-cgi\/image\/[^/]+\/(https:\/\/.*)$/.exec(rendered.pathname)?.[1]
        : null;
    if (rendered.origin !== root.origin && !directSource) continue;
    const href =
      directSource ?? (rendered.pathname.endsWith('/_image') ? rendered.searchParams.get('href') : rendered.pathname);
    const media = href ? new URL(href, root) : null;
    if (
      media?.origin === root.origin &&
      media.pathname.startsWith(root.pathname) &&
      /\/media\/content\/(?:[a-f0-9]{64}\/)?[a-f0-9]{64}$/.test(media.pathname)
    )
      return {
        mediaPath: '/' + media.pathname.slice(root.pathname.length),
        transformPath: `/_image?href=${encodeURIComponent(media.pathname)}&w=480`,
      };
  }
  throw new Error('The page renders no published CMS image under the site base.');
}

export function imageTransformIssues(input: {
  bytes: number;
  cacheControl: string | null;
  contentType: string | null;
  fallback: string | null;
  originalBytes: number | null;
  status: number;
}): string[] {
  const issues: string[] = [];
  if (input.status !== 200)
    issues.push(`Expected the 480 px transformation to return HTTP 200; received ${input.status}.`);
  if (!/^image\/(?:avif|webp)\b/i.test(input.contentType ?? ''))
    issues.push(`Expected AVIF or WebP; received ${input.contentType ?? 'no content type'}.`);
  if (input.fallback) issues.push(`The renderer served the original instead of a transformation (${input.fallback}).`);
  if (!input.cacheControl?.includes('immutable'))
    issues.push(`Expected an immutable transformation; received Cache-Control ${input.cacheControl ?? 'none'}.`);
  if (input.bytes > imageTransformByteBudget)
    issues.push(`Expected at most ${imageTransformByteBudget} bytes; received ${input.bytes}.`);
  if (input.originalBytes !== null && input.bytes >= input.originalBytes)
    issues.push(`Expected the transformation to be smaller than the ${input.originalBytes}-byte original.`);
  return issues;
}

/** Published pages may be text-only, so sample the first candidate in publication order that renders a content image. */
export async function findSectionMediaPath(
  section: string,
  candidates: readonly string[],
  read: (route: string) => Promise<string>,
  siteUrl: string,
): Promise<string> {
  for (const route of candidates) {
    const html = await read(route);
    if (findMainImageSource(html)) return findPublicMediaPath(html, siteUrl);
  }
  throw new Error(
    `No published ${section} page renders a content image (checked ${candidates.length}: ${candidates.join(', ')}).`,
  );
}

function findMainImageSource(html: string): string | undefined {
  // ponytail: inspect generated Astro img markup only; use an HTML parser if that output format changes.
  // Confine the search to <main>: the footer logo after </main> is not a content image.
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1] ?? '';
  return /<img\b[^>]*\ssrc=(["'])(.*?)\1/i.exec(main)?.[2];
}

export function findPublicMediaPath(html: string, siteUrl: string): string {
  const source = findMainImageSource(html);
  if (!source) throw new Error('Public media source page has no rendered content image.');
  const root = new URL(createRouteUrl(siteUrl));
  const asset = new URL(source.replaceAll('&amp;', '&'), root);
  if (asset.origin === 'https://images.blackboxrecordsathens.com') {
    const sourcePath = /^\/cdn-cgi\/image\/[^/]+\/(https:\/\/.*)$/.exec(asset.pathname)?.[1];
    const original = sourcePath ? new URL(sourcePath) : null;
    if (
      original?.origin === root.origin &&
      original.pathname.startsWith(root.pathname) &&
      /\/media\/content\/[a-f0-9]{64}$/.test(original.pathname)
    ) {
      return asset.href;
    }
  }
  if (asset.origin !== root.origin || !asset.pathname.startsWith(root.pathname)) {
    throw new Error('Public media must be served under the site base.');
  }
  return '/' + asset.pathname.slice(root.pathname.length) + asset.search;
}

/** Every published detail page per section, in publication order; route checks use the first, media checks the first with an image. */
export type RepresentativeCandidates = { [Section in keyof RepresentativePaths]: string[] };

export function discoverRepresentativePaths(
  sitemapXml: string,
  storeHtml: string,
  siteUrl: string,
): RepresentativePaths {
  return firstRepresentativePaths(discoverRepresentativeCandidates(sitemapXml, storeHtml, siteUrl));
}

function firstRepresentativePaths(candidates: RepresentativeCandidates): RepresentativePaths {
  return {
    artist: candidates.artist[0]!,
    news: candidates.news[0]!,
    release: candidates.release[0]!,
    storeItem: candidates.storeItem[0]!,
  };
}

export function discoverRepresentativeCandidates(
  sitemapXml: string,
  storeHtml: string,
  siteUrl: string,
): RepresentativeCandidates {
  // ponytail: scan generated sitemap and Store listing markup; use XML/HTML parsers if those formats change.
  const root = new URL(createRouteUrl(siteUrl));
  const toSitePaths = (urls: readonly URL[]) =>
    urls
      .filter((url) => url.pathname.startsWith(root.pathname))
      .map((url) => '/' + url.pathname.slice(root.pathname.length));
  // Sitemap entries carry the canonical origin, which can differ from the probed deployment URL.
  const sitemapPaths = toSitePaths(
    [...sitemapXml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((match) => new URL(match[1] ?? '', root)),
  );
  const storePaths = toSitePaths(
    [...storeHtml.matchAll(/<a\b[^>]*\shref=(["'])(.*?)\1/gi)]
      .map((match) => new URL(match[2] ?? '', root))
      .filter((url) => url.origin === root.origin),
  );
  const all = (section: string, paths: readonly string[], pattern: RegExp): string[] => {
    const found = [...new Set(paths.filter((candidate) => pattern.test(candidate)))];
    if (!found.length) throw new Error(`Could not discover a published ${section} page for UAT static smoke.`);
    return found;
  };

  return {
    artist: all('artist', sitemapPaths, /^\/artists\/[^/]+\/$/),
    news: all('news', sitemapPaths, /^\/news\/[^/]+\/$/),
    release: all('release', sitemapPaths, /^\/releases\/[^/]+\/$/),
    storeItem: all(
      'Store Item',
      storePaths.filter((path) => !reservedStoreRouteSegments.has(path.split('/')[2] ?? '')),
      /^\/store\/[^/]+\/$/,
    ),
  };
}

async function discoverUatStaticCandidates(options: UatStaticSmokeOptions): Promise<RepresentativeCandidates> {
  const read = async (routePath: string) => {
    const response = await fetchSmokeResponse(createRouteUrl(options.siteUrl, routePath), options.timeoutMs);
    if (!response.ok) throw new Error(`Page discovery could not read ${routePath}: HTTP ${response.status}.`);
    return response.text();
  };
  const [sitemapXml, storeHtml] = await Promise.all([read('/sitemap.xml'), read('/store/')]);

  return discoverRepresentativeCandidates(sitemapXml, storeHtml, options.siteUrl);
}

async function checkPublicRoutes(
  page: Page,
  options: UatStaticSmokeOptions,
  paths: RepresentativePaths,
): Promise<UatStaticSmokeCheck[]> {
  const routeChecks: UatStaticSmokeCheck[] = [];

  for (const [routePath, expectedText] of publicSmokeRoutes(paths)) {
    const url = createRouteUrl(options.siteUrl, routePath);
    const requestedPaths: string[] = [];
    const onRequest = (request: Request) => requestedPaths.push(new URL(request.url()).pathname);
    if (routePath === '/store/') page.on('request', onRequest);
    const probe = await probeSmokeRoute(page, url, options.timeoutMs);
    const issues = [...probe.issues];

    if (!probe.status || probe.status >= 400) {
      issues.push(`Expected ${routePath} to return HTTP 200; received ${probe.status ?? 'no response'}.`);
    }

    for (const expectedSnippet of expectedText) {
      if (!containsTextIgnoreCase(probe.bodyText, expectedSnippet)) {
        issues.push(`Expected ${routePath} to include "${expectedSnippet}".`);
      }
    }

    issues.push(...checkReviewSiteMarker(probe.bodyText, probe.title, routePath));

    for (const exposure of scanHighRiskSmokeExposure(probe.bodyText)) {
      issues.push(`${routePath} exposed ${exposure}.`);
    }

    if (routePath === '/store/') {
      try {
        await page.waitForFunction(
          () => {
            const listingPrices = [...document.querySelectorAll<HTMLElement>('[data-store-listing-price]')];
            return (
              listingPrices.length > 0 &&
              listingPrices.every((element) =>
                ['ready', 'unavailable'].includes(element.dataset.storeListingPriceState || ''),
              )
            );
          },
          undefined,
          { timeout: options.timeoutMs },
        );
      } catch {
        issues.push('Expected Store listing prices to reach ready or unavailable state.');
      }

      const listingProjectionReads = requestedPaths.filter((path) => path.endsWith('/api/store/listing-prices'));
      const perCardStoreOfferReads = requestedPaths.filter((path) => /\/api\/store\/items\/[^/]+$/.test(path));
      if (listingProjectionReads.length !== 1) {
        issues.push(`Expected one listing-price projection read; received ${listingProjectionReads.length}.`);
      }
      if (perCardStoreOfferReads.length > 0) {
        issues.push(`Expected no per-card Store Offer listing reads; received ${perCardStoreOfferReads.length}.`);
      }
      page.off('request', onRequest);
    }

    routeChecks.push({
      bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(probe.bodyText), 450),
      contentType: null,
      issues,
      kind: 'page',
      path: routePath,
      status: probe.status,
      title: probe.title,
      url,
    });
  }

  const merchPath = '/store/merch/';
  const merchUrl = createRouteUrl(options.siteUrl, merchPath);
  const merchProbe = await probeSmokeRoute(page, merchUrl, options.timeoutMs);
  const merchIssues = [...merchProbe.issues];
  const expectedMerchRedirectUrl = createRouteUrl(options.siteUrl, '/store/');
  if (merchProbe.url !== expectedMerchRedirectUrl) {
    merchIssues.push(`Expected ${merchPath} to replace to ${expectedMerchRedirectUrl}; received ${merchProbe.url}.`);
  }
  routeChecks.push({
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(merchProbe.bodyText), 450),
    contentType: null,
    issues: merchIssues,
    kind: 'page',
    path: merchPath,
    status: merchProbe.status,
    title: merchProbe.title,
    url: merchProbe.url,
  });

  const legacyDistroPath = '/distro/';
  const legacyDistroUrl = createRouteUrl(options.siteUrl, legacyDistroPath);
  const legacyDistroProbe = await probeSmokeRoute(page, legacyDistroUrl, options.timeoutMs);
  const legacyDistroIssues = [...legacyDistroProbe.issues];
  const expectedLegacyDistroUrl = createRouteUrl(options.siteUrl, '/store/distro/');

  if (!legacyDistroProbe.url.startsWith(expectedLegacyDistroUrl)) {
    legacyDistroIssues.push(
      `Expected ${legacyDistroPath} to replace to ${expectedLegacyDistroUrl}; received ${legacyDistroProbe.url}.`,
    );
  }
  legacyDistroIssues.push(
    ...checkReviewSiteMarker(legacyDistroProbe.bodyText, legacyDistroProbe.title, legacyDistroPath),
  );
  routeChecks.push({
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(legacyDistroProbe.bodyText), 450),
    contentType: null,
    issues: legacyDistroIssues,
    kind: 'page',
    path: legacyDistroPath,
    status: legacyDistroProbe.status,
    title: legacyDistroProbe.title,
    url: legacyDistroProbe.url,
  });

  routeChecks.push(await checkTextAsset(options, '/sitemap.xml', ['<urlset', '</urlset>']));
  routeChecks.push(await checkTextAsset(options, '/robots.txt', ['User-agent:', 'Sitemap:']));

  return routeChecks;
}

async function checkTextAsset(
  options: UatStaticSmokeOptions,
  routePath: string,
  expectedSnippets: readonly string[],
): Promise<UatStaticSmokeCheck> {
  const url = createRouteUrl(options.siteUrl, routePath);
  const issues: string[] = [];
  let response: Response | null = null;
  let text = '';
  let contentType: string | null = null;

  try {
    response = await fetchSmokeResponse(url, options.timeoutMs);
    contentType = response.headers.get('content-type');
    text = await response.text();
  } catch (error) {
    issues.push(
      `Expected ${routePath} to be readable within ${options.timeoutMs}ms: ${redactSensitiveSmokeText(String(error))}.`,
    );
  }

  if (response && !response.ok) {
    issues.push(`Expected ${routePath} to return HTTP 200; received ${response.status}.`);
  }

  for (const expectedSnippet of expectedSnippets) {
    if (!text.includes(expectedSnippet)) {
      issues.push(`Expected ${routePath} to include "${expectedSnippet}".`);
    }
  }

  for (const exposure of scanHighRiskSmokeExposure(text)) {
    issues.push(`${routePath} exposed ${exposure}.`);
  }

  return {
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(text), 450),
    contentType,
    issues,
    kind: 'text-asset',
    path: routePath,
    status: response?.status ?? null,
    title: null,
    url,
  };
}

async function checkBinaryAsset(
  options: UatStaticSmokeOptions,
  routePath: string,
  expectedContentTypePrefix: string,
): Promise<UatStaticSmokeCheck> {
  const url = routePath.startsWith('https://') ? routePath : createRouteUrl(options.siteUrl, routePath);
  const issues: string[] = [];
  let response: Response | null = null;
  let contentType: string | null = null;

  try {
    response = await fetchSmokeResponse(url, options.timeoutMs);
    contentType = response.headers.get('content-type');
  } catch (error) {
    issues.push(
      `Expected ${routePath} to be readable within ${options.timeoutMs}ms: ${redactSensitiveSmokeText(String(error))}.`,
    );
  }

  if (response && !response.ok) {
    issues.push(`Expected ${routePath} to return HTTP 200; received ${response.status}.`);
  }

  if (!contentType?.startsWith(expectedContentTypePrefix)) {
    issues.push(
      `Expected ${routePath} to return a ${expectedContentTypePrefix} response; received ${contentType ?? 'unknown'}.`,
    );
  }

  return {
    bodyTextSnippet: null,
    contentType,
    issues,
    kind: 'binary-asset',
    path: routePath,
    status: response?.status ?? null,
    title: null,
    url,
  };
}

async function fetchSmokeResponse(url: string, timeoutMs: number, headers?: HeadersInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { headers, method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function maybeCaptureStaticSmokeScreenshot(
  page: Page,
  scenarioArtifactDir: string,
  hasIssues: boolean,
  mode: UatStaticSmokeOptions['screenshots'],
): Promise<string | null> {
  if (mode === 'never') {
    return null;
  }

  if (mode === 'on-failure' && !hasIssues) {
    return null;
  }

  const screenshotPath = path.join(scenarioArtifactDir, mode === 'always' ? 'final.png' : 'failure.png');
  await captureSmokePageScreenshot(page, screenshotPath, true);

  return screenshotPath;
}

function buildUatStaticSmokeSummary(
  scenarioName: UatStaticSmokeScenarioName,
  description: string,
  checks: UatStaticSmokeCheck[],
  consoleErrors: string[],
  pageErrors: string[],
  status: UatStaticSmokeEvidence['status'],
): string {
  const issueCount =
    checks.reduce((count, check) => count + check.issues.length, 0) + consoleErrors.length + pageErrors.length;
  return [
    `Scenario ${scenarioName}: ${description}`,
    `Status: ${status.toUpperCase()} (${issueCount} issue(s))`,
    `- checks: ${checks.length}`,
    `- console errors: ${consoleErrors.length}`,
    `- page errors: ${pageErrors.length}`,
  ].join('\n');
}

export function buildUatStaticSmokeEvidence(input: UatStaticSmokeEvidenceInput): UatStaticSmokeEvidence {
  const summary = buildUatStaticSmokeSummary(
    input.scenario.name,
    input.scenario.description,
    input.checks,
    input.consoleErrors,
    input.pageErrors,
    input.status,
  );

  return {
    authenticated: false,
    checks: input.checks,
    consoleErrors: input.consoleErrors,
    environment: 'uat',
    generatedAt: new Date().toISOString(),
    pageErrors: input.pageErrors,
    readOnly: true,
    scenario: input.scenario.name,
    screenshotPath: input.screenshotPath,
    siteUrl: input.siteUrl,
    status: input.status,
    summary,
    suite: 'uat-static',
  };
}

function containsTextIgnoreCase(text: string, expected: string): boolean {
  return text.toLowerCase().includes(expected.toLowerCase());
}

async function main(): Promise<void> {
  const options = parseUatStaticSmokeArgs(process.argv.slice(2));
  const { evidence, runArtifactDir } = await runUatStaticSmoke(options);
  const failedEvidence = evidence.filter((item) => item.status === 'failed');

  appendSmokeStepSummary({
    evidenceDir: runArtifactDir,
    scenarios: evidence.map((item) => ({
      issues: [...item.checks.flatMap((check) => check.issues), ...item.consoleErrors, ...item.pageErrors],
      name: item.scenario,
      status: item.status,
    })),
    status: failedEvidence.length ? 'failed' : 'passed',
    suite: 'uat-static',
  });

  if (failedEvidence.length) {
    console.error(JSON.stringify(failedEvidence, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(evidence, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(redactSensitiveSmokeText(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  });
}
