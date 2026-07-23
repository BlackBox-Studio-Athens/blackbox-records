import { mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { chromium, type Browser, type BrowserContext, type Page, type Request } from 'playwright';
import { parse } from 'yaml';

import {
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
  redactSensitiveSmokeText,
  scanHighRiskSmokeExposure,
  truncateForConsole,
  writeJsonFile,
} from './smoke-core';
import { attachSmokePageDiagnostics, captureSmokePageScreenshot, probeSmokeRoute } from './smoke-browser';

export type UatStaticSmokeScenarioName = 'cms_admin' | 'cms_assets' | 'checkout_shell' | 'public_routes';
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

export type CmsAdminRenderedState = {
  bodyText: string;
  hasCollectionUi: boolean;
  hasConfigLink: boolean;
  hasCmsRoot: boolean;
  hasExactPinnedRuntime: boolean;
  hasRuntimeApi: boolean;
  isAdminReady: boolean;
  isAuthReady: boolean;
  runtimeScriptUrls: string[];
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

const defaultSiteUrl = 'https://blackbox-studio-athens.github.io/blackbox-records';
const defaultEvidenceDir = path.join('.codex-artifacts', 'smoke', 'uat', 'uat-static');
const representativeReleaseSlug = 'disintegration';
const representativeArtistSlug = 'chronoboros';
const representativeNewsSlug = 'lorem-ipsum';
const representativeStoreItemSlug = 'disintegration-black-vinyl-lp';
const reviewSiteMarkerTexts = ['TEST SITE', 'Test payments only'] as const;
const reviewSiteTitlePrefix = '[TEST] ';
const reviewSiteCheckoutWarning = 'Test checkout. No real payment will be taken.';

const allScenarioNames: readonly UatStaticSmokeScenarioName[] = [
  'cms_admin',
  'cms_assets',
  'checkout_shell',
  'public_routes',
];

const UAT_STATIC_SMOKE_SCENARIOS: Record<UatStaticSmokeScenarioName, UatStaticSmokeScenarioDefinition> = {
  cms_admin: {
    description: 'Verify the Decap admin boot screen and configuration bridge.',
    name: 'cms_admin',
  },
  cms_assets: {
    description: 'Verify CMS assets, representative media, and public secret exposure scanning.',
    name: 'cms_assets',
  },
  checkout_shell: {
    description: 'Verify the native checkout shell route without creating provider state.',
    name: 'checkout_shell',
  },
  public_routes: {
    description: 'Verify the public routes, sitemap, and robots output.',
    name: 'public_routes',
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
        'Usage: pnpm smoke:uat-static -- --site-url <url> --scenario cms_admin|cms_assets|checkout_shell|public_routes|all [--timeout-ms <ms>] [--evidence-dir <dir>] [--screenshots on-failure|always|never] [--headed]',
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
  return selection === 'all' ? [...Object.values(UAT_STATIC_SMOKE_SCENARIOS)] : [UAT_STATIC_SMOKE_SCENARIOS[selection]];
}

export async function runUatStaticSmoke(options: UatStaticSmokeOptions): Promise<UatStaticSmokeEvidence[]> {
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

  return evidence;
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
      input.scenario.name === 'cms_admin'
        ? [
            await checkCmsAdminPage(page, input.options),
            await checkTextAsset(input.options, '/admin/config.yml', ['# blackbox-decap-mode: hosted', 'collections:']),
          ]
        : input.scenario.name === 'cms_assets'
          ? await checkCmsAssets(input.options)
          : input.scenario.name === 'checkout_shell'
            ? [await checkCheckoutShellPage(page, input.options)]
            : await checkPublicRoutes(page, input.options);

    const consoleErrors = diagnostics.consoleErrors.slice();
    const pageErrors = diagnostics.pageErrors.slice();
    const hasIssuesBeforeScreenshot =
      checks.some((check) => check.issues.length || check.status !== 200) ||
      consoleErrors.length > 0 ||
      pageErrors.length > 0;
    const screenshotPath =
      input.scenario.name === 'cms_assets'
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
      checks.some((check) => check.issues.length || check.status !== 200) ||
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

async function checkCmsAdminPage(page: Page, options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck> {
  const url = createRouteUrl(options.siteUrl, '/admin/#/');
  const probe = await probeSmokeRoute(page, url, options.timeoutMs);
  const issues = [...probe.issues];

  await waitForCmsAdminTerminalState(page, options.timeoutMs).catch((error: unknown) => {
    issues.push(
      `Expected /admin/#/ to reach a usable Decap auth or collection state: ${redactSensitiveSmokeText(
        truncateForConsole(String(error)),
      )}.`,
    );
  });

  const renderedState = await readCmsAdminRenderedState(page, options.timeoutMs).catch((error: unknown) => {
    issues.push(`Expected /admin/#/ rendered state to be readable: ${redactSensitiveSmokeText(String(error))}.`);
    return null;
  });

  if (!probe.status || probe.status >= 400) {
    issues.push(`Expected /admin/#/ to return HTTP 200; received ${probe.status ?? 'no response'}.`);
  }

  if (renderedState) {
    issues.push(...checkCmsAdminRenderedState(renderedState));
  }

  for (const exposure of scanHighRiskSmokeExposure(renderedState?.bodyText ?? probe.bodyText)) {
    issues.push(`Admin page exposed ${exposure}.`);
  }

  return {
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(renderedState?.bodyText ?? probe.bodyText), 500),
    contentType: null,
    issues,
    kind: 'page',
    path: '/admin/#/',
    status: probe.status,
    title: probe.title,
    url,
  };
}

async function waitForCmsAdminTerminalState(page: Page, timeoutMs: number): Promise<void> {
  await page.waitForFunction(
    () => {
      const globalState = window as typeof window & {
        __BLACKBOX_ADMIN_AUTH_READY__?: boolean;
        __BLACKBOX_ADMIN_READY__?: boolean;
      };
      const bodyText = document.body?.innerText || '';
      const hasLoadingText = /Preparing the editor|Loading configuration/i.test(bodyText);
      const hasEnhancedAuth = Boolean(
        globalState.__BLACKBOX_ADMIN_AUTH_READY__ ||
        document.querySelector('[data-blackbox-cms-auth-button="true"]') ||
        bodyText.includes('Sign in with DecapBridge'),
      );
      const hasCollectionUi = Boolean(
        document.querySelector('a[href*="#/collections/"]') ||
        document.querySelector('[class*="Collection"]') ||
        /\bCollections\b|\bHome Content\b|\bReleases\b|\bDistro\b/.test(bodyText),
      );

      return hasEnhancedAuth || hasCollectionUi || (Boolean(globalState.__BLACKBOX_ADMIN_READY__) && !hasLoadingText);
    },
    undefined,
    { timeout: Math.min(timeoutMs, 20_000) },
  );
}

async function readCmsAdminRenderedState(page: Page, timeoutMs: number): Promise<CmsAdminRenderedState> {
  void timeoutMs;

  return page.evaluate(() => {
    const globalState = window as typeof window & {
      __BLACKBOX_ADMIN_AUTH_READY__?: boolean;
      __BLACKBOX_ADMIN_READY__?: boolean;
    };
    const bodyText = document.body?.innerText || '';
    const runtimeScriptUrls = Array.from(document.scripts)
      .map((script) => script.src)
      .filter(Boolean);
    const hasCollectionUi = Boolean(
      document.querySelector('a[href*="#/collections/"]') ||
      document.querySelector('[class*="Collection"]') ||
      /\bCollections\b|\bHome Content\b|\bReleases\b|\bDistro\b/.test(bodyText),
    );

    return {
      bodyText,
      hasCollectionUi,
      hasConfigLink: Boolean(document.querySelector('link[rel="cms-config-url"][href*="/admin/config.yml"]')),
      hasCmsRoot: Boolean(document.getElementById('nc-root')),
      hasExactPinnedRuntime: runtimeScriptUrls.some(
        (url) => url === 'https://unpkg.com/decap-cms@3.14.1/dist/decap-cms.js',
      ),
      hasRuntimeApi: Boolean((window as typeof window & { CMS?: unknown }).CMS),
      isAdminReady: Boolean(globalState.__BLACKBOX_ADMIN_READY__),
      isAuthReady: Boolean(
        globalState.__BLACKBOX_ADMIN_AUTH_READY__ ||
        document.querySelector('[data-blackbox-cms-auth-button="true"]') ||
        bodyText.includes('Sign in with DecapBridge'),
      ),
      runtimeScriptUrls,
    };
  });
}

async function checkCheckoutShellPage(page: Page, options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck> {
  const url = createRouteUrl(options.siteUrl, '/store/checkout/');
  const probe = await probeSmokeRoute(page, url, options.timeoutMs);
  const issues = [...probe.issues];

  if (!probe.status || probe.status >= 400) {
    issues.push(`Expected checkout shell route to return HTTP 200; received ${probe.status ?? 'no response'}.`);
  }

  for (const expectedText of ['Checkout', 'Shipping & Payment', 'Secure Stripe Checkout']) {
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

async function checkCmsAssets(options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck[]> {
  const checks: UatStaticSmokeCheck[] = [];

  checks.push(
    await checkTextAsset(options, '/admin/config.yml', [
      'collections:',
      'media_folder:',
      'extension: json',
      'format: json',
    ]),
  );
  checks.push(
    await checkTextAsset(options, '/admin/init.js', [
      'window.__BLACKBOX_ADMIN__',
      'blackbox-cms-preview-auto-collapsed',
      "mediaButton.dataset.blackboxTopLevelMedia = 'hidden'",
    ]),
  );
  checks.push(await checkTextAsset(options, '/admin/preview-assets.js', ['resolvePreviewAssetUrl']));
  checks.push(await checkTextAsset(options, '/admin/admin.css', ['blackbox-cms']));
  checks.push(await checkTextAsset(options, '/admin/preview.css', ['body']));
  checks.push(await checkBinaryAsset(options, '/admin/media/home/hero-live-band.jpg', 'image/'));
  checks.push(await checkBinaryAsset(options, '/admin/media/artists/Chronoboros-band-logo.jpg', 'image/'));
  checks.push(
    await checkBinaryAsset(
      options,
      '/admin/media/releases/651165517_1798070461631923_2184094727995022471_n.jpg',
      'image/',
    ),
  );
  checks.push(await checkBinaryAsset(options, '/admin/media/distro/mass-culture-barren-point.jpg', 'image/'));
  checks.push(await checkBinaryAsset(options, '/admin/media/news/img_0697.jpg', 'image/'));

  return checks;
}

async function checkPublicRoutes(page: Page, options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck[]> {
  const routeChecks: UatStaticSmokeCheck[] = [];
  const routes = [
    ['/', ['BlackBox Records']],
    ['/releases/', ['Releases']],
    [`/releases/${representativeReleaseSlug}/`, ['Disintegration', 'Afterwise']],
    ['/artists/', ['Artists']],
    [`/artists/${representativeArtistSlug}/`, ['Chronoboros']],
    ['/news/', ['News']],
    [`/news/${representativeNewsSlug}/`, ['Chronoboros', 'Caregivers']],
    ['/store/', ['Store']],
    ['/store/blackbox-releases/', ['BlackBox Releases']],
    ['/store/distro/', ['Distro', 'Browse formats']],
    [`/store/${representativeStoreItemSlug}/`, ['Disintegration', 'Add it to the cart']],
    ['/services/', ['Services']],
    ['/about/', ['About']],
  ] as const;

  for (const [routePath, expectedText] of routes) {
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
        await page.locator('[data-store-listing-price]').first().scrollIntoViewIfNeeded({ timeout: options.timeoutMs });
        await page.waitForFunction(
          () => {
            const firstViewportPrices = [
              ...document.querySelectorAll<HTMLElement>('[data-store-listing-price]'),
            ].filter((element) => {
              const bounds = element.getBoundingClientRect();
              return bounds.bottom > 0 && bounds.top < window.innerHeight;
            });
            return (
              firstViewportPrices.length > 0 &&
              firstViewportPrices.every((element) =>
                ['ready', 'unavailable'].includes(element.dataset.storeListingPriceState || ''),
              )
            );
          },
          undefined,
          { timeout: options.timeoutMs },
        );
      } catch {
        issues.push('Expected first-viewport Store listing prices to reach ready or unavailable state.');
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

  if (routePath === '/admin/config.yml') {
    issues.push(...checkCmsConfigPlaceholders(text));
    issues.push(...checkCmsSingletonJsonDeclarations(text));
    issues.push(...checkCmsHostedConfigDeclarations(text));
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
  const url = createRouteUrl(options.siteUrl, routePath);
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

async function fetchSmokeResponse(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
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

export function checkCmsConfigPlaceholders(text: string): string[] {
  const issues: string[] = [];
  let config: Record<string, unknown>;

  try {
    const parsed = parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return issues;
    config = parsed as Record<string, unknown>;
  } catch {
    return issues;
  }

  const backend =
    config.backend && typeof config.backend === 'object' && !Array.isArray(config.backend)
      ? (config.backend as Record<string, unknown>)
      : {};
  const connectionValues = [
    backend.repo,
    backend.base_url,
    backend.auth_endpoint,
    backend.auth_token_endpoint,
    backend.gateway_url,
    config.site_url,
    config.display_url,
    config.logo_url,
  ].filter((value): value is string => typeof value === 'string');

  if (connectionValues.some((value) => value.includes('__SET_DECAPBRIDGE_SITE_ID__'))) {
    issues.push('CMS config still contains the __SET_DECAPBRIDGE_SITE_ID__ placeholder.');
  }

  if (connectionValues.some((value) => /https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i.test(value))) {
    issues.push('CMS config still points at a local backend or loopback URL.');
  }

  if (connectionValues.some((value) => /(?:CHANGE_ME|REPLACE_ME|example\.com|\.invalid\b|\bTODO\b)/i.test(value))) {
    issues.push('CMS config still contains an unsafe hosted placeholder.');
  }

  return issues;
}

export function checkCmsHostedConfigDeclarations(text: string): string[] {
  const issues: string[] = [];
  let config: Record<string, unknown>;

  try {
    const parsed = parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('root is not a mapping');
    config = parsed as Record<string, unknown>;
  } catch (error) {
    return [`CMS config is not valid YAML: ${redactSensitiveSmokeText(String(error))}.`];
  }

  const backend =
    config.backend && typeof config.backend === 'object' && !Array.isArray(config.backend)
      ? (config.backend as Record<string, unknown>)
      : {};
  const expectedBackendValues: Record<string, string> = {
    auth_type: 'pkce',
    branch: 'main',
    name: 'git-gateway',
  };

  for (const [field, expected] of Object.entries(expectedBackendValues)) {
    if (backend[field] !== expected) issues.push(`CMS hosted backend.${field} must equal "${expected}".`);
  }

  for (const field of ['repo', 'auth_endpoint', 'auth_token_endpoint', 'base_url', 'gateway_url']) {
    if (typeof backend[field] !== 'string' || !backend[field].trim()) {
      issues.push(`CMS hosted backend.${field} must be a non-empty string.`);
    }
  }

  for (const field of ['base_url', 'gateway_url']) {
    if (typeof backend[field] === 'string' && !backend[field].startsWith('https://')) {
      issues.push(`CMS hosted backend.${field} must use HTTPS.`);
    }
  }

  if ('proxy_url' in backend || config.local_backend === true) {
    issues.push('CMS hosted config must not expose local proxy settings.');
  }
  if (config.publish_mode !== 'simple') issues.push('CMS hosted publish_mode must equal "simple".');
  if (config.media_folder !== 'apps/web/src/content/home' || config.public_folder !== './') {
    issues.push('CMS hosted global media fallback must stay aligned to the non-exposed Home media root.');
  }

  const siteUrl = typeof config.site_url === 'string' ? config.site_url : '';
  const displayUrl = typeof config.display_url === 'string' ? config.display_url : '';
  if (!siteUrl.startsWith('https://') || displayUrl !== siteUrl) {
    issues.push('CMS hosted site_url and display_url must match one HTTPS UAT site root.');
  }

  const collections = Array.isArray(config.collections) ? config.collections : [];
  const collectionNames = collections.flatMap((collection) => {
    if (!collection || typeof collection !== 'object' || Array.isArray(collection)) return [];
    const name = (collection as Record<string, unknown>).name;
    return typeof name === 'string' ? [name] : [];
  });
  for (const collectionName of ['home', 'artists', 'releases', 'distro', 'news']) {
    if (!collectionNames.includes(collectionName)) {
      issues.push(`CMS hosted config is missing the ${collectionName} collection.`);
    }
  }

  if (/apps\/web\/src\/content\/uploads|\/admin\/media\/uploads/i.test(text)) {
    issues.push('CMS hosted config must not advertise an unowned global uploads inventory.');
  }

  return issues;
}

export function checkCmsSingletonJsonDeclarations(text: string): string[] {
  const issues: string[] = [];
  const singletonPaths = [
    'apps/web/src/content/home/site.json',
    'apps/web/src/content/about/site.json',
    'apps/web/src/content/services/site.json',
    'apps/web/src/content/newsletter/site.json',
    'apps/web/src/content/settings/site.json',
  ];
  const folderPaths = [
    'apps/web/src/content/artists',
    'apps/web/src/content/releases',
    'apps/web/src/content/distro',
    'apps/web/src/content/news',
    'apps/web/src/content/navigation',
    'apps/web/src/content/socials',
  ];
  const jsonExtensionCount = (text.match(/^\s+extension:\s+json\s*$/gm) || []).length;
  const jsonFormatCount = (text.match(/^\s+format:\s+json\s*$/gm) || []).length;

  for (const singletonPath of singletonPaths) {
    if (!text.includes(`file: "${singletonPath}"`)) {
      issues.push(`CMS config does not include singleton file path "${singletonPath}".`);
    }
  }

  for (const folderPath of folderPaths) {
    if (!text.includes(`folder: "${folderPath}"`)) {
      issues.push(`CMS config does not include collection folder path "${folderPath}".`);
    }
  }

  if (/file: "src\/content\/|folder: "src\/content\/|media_folder: src\/content\//.test(text)) {
    issues.push('CMS config still uses app-root src/content paths; DecapBridge needs repo-root apps/web paths.');
  }

  if (jsonExtensionCount < singletonPaths.length) {
    issues.push(
      `CMS config includes ${jsonExtensionCount} JSON extension declarations; expected at least ${singletonPaths.length}.`,
    );
  }

  if (jsonFormatCount < singletonPaths.length) {
    issues.push(
      `CMS config includes ${jsonFormatCount} JSON format declarations; expected at least ${singletonPaths.length}.`,
    );
  }

  return issues;
}

export function checkCmsAdminRenderedState(state: CmsAdminRenderedState): string[] {
  const issues: string[] = [];
  const bodyText = state.bodyText.trim();
  const hasLoadingText = containsAnyTextIgnoreCase(bodyText, [
    'Preparing the editor',
    'Loading configuration...',
    'Loading configuration',
  ]);

  if (!state.hasConfigLink) {
    issues.push('Expected the admin page to point at /admin/config.yml via rel="cms-config-url".');
  }

  if (!state.hasCmsRoot) {
    issues.push('Expected Decap CMS to mount #nc-root.');
  }

  if (!state.hasExactPinnedRuntime) {
    issues.push('Expected /admin/#/ to load exactly decap-cms@3.14.1 from the pinned runtime URL.');
  }

  if (!state.hasRuntimeApi) {
    issues.push('Expected the pinned Decap runtime to expose the CMS registration API.');
  }

  if (!bodyText) {
    issues.push('Expected /admin/#/ to render visible Decap CMS text.');
    return issues;
  }

  if (hasLoadingText && !state.isAuthReady && !state.hasCollectionUi) {
    issues.push('Expected /admin/#/ to finish Decap bootstrap instead of staying on loading copy.');
    return issues;
  }

  if (!state.isAdminReady && !state.isAuthReady && !state.hasCollectionUi) {
    issues.push('Expected the BlackBox admin runtime to finish registering Decap previews.');
  }

  if (!state.isAuthReady && !state.hasCollectionUi) {
    issues.push('Expected /admin/#/ to render a usable DecapBridge auth surface or authenticated collection UI.');
  }

  if (state.isAuthReady && !state.hasCollectionUi) {
    for (const expectedText of ['BlackBox CMS', 'Sign in to edit content', 'Sign in with DecapBridge']) {
      if (!containsTextIgnoreCase(bodyText, expectedText)) {
        issues.push(`Expected hosted Decap auth copy to include "${expectedText}".`);
      }
    }
  }

  if (/\b(?:username|password)\b|email\s*\/\s*password/i.test(bodyText)) {
    issues.push('Expected hosted Decap auth to omit classic username/password copy.');
  }

  return issues;
}

function containsTextIgnoreCase(text: string, expected: string): boolean {
  return text.toLowerCase().includes(expected.toLowerCase());
}

function containsAnyTextIgnoreCase(text: string, expectedSnippets: readonly string[]): boolean {
  return expectedSnippets.some((snippet) => containsTextIgnoreCase(text, snippet));
}

async function main(): Promise<void> {
  const options = parseUatStaticSmokeArgs(process.argv.slice(2));
  const evidence = await runUatStaticSmoke(options);
  const failedEvidence = evidence.filter((item) => item.status === 'failed');

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
