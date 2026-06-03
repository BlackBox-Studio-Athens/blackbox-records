import { mkdirSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

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
  checks: UatStaticSmokeCheck[];
  consoleErrors: string[];
  environment: 'uat';
  generatedAt: string;
  pageErrors: string[];
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

const defaultSiteUrl = 'https://blackbox-studio-athens.github.io/blackbox-records';
const defaultEvidenceDir = path.join('.codex-artifacts', 'smoke', 'uat', 'uat-static');
const representativeReleaseSlug = 'disintegration';
const representativeArtistSlug = 'chronoboros';
const representativeNewsSlug = 'lorem-ipsum';
const representativeStoreItemSlug = 'disintegration-black-vinyl-lp';

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
        ? [await checkCmsAdminPage(page, input.options)]
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
  const configHref = await page
    .locator('link[rel="cms-config-url"]')
    .getAttribute('href')
    .catch(() => null);

  if (!probe.status || probe.status >= 400) {
    issues.push(`Expected /admin/#/ to return HTTP 200; received ${probe.status ?? 'no response'}.`);
  }

  if (
    !containsAnyTextIgnoreCase(probe.bodyText, [
      'Preparing the editor',
      'Loading configuration...',
      'Loading configuration',
    ])
  ) {
    issues.push('Expected the admin boot copy to show the Decap loading state.');
  }

  if (
    !containsAnyTextIgnoreCase(probe.bodyText, [
      'Loading content collections, previews, and media tools.',
      'Loading configuration...',
      'Loading configuration',
    ])
  ) {
    issues.push('Expected the admin boot copy to describe the CMS bootstrap state.');
  }

  if (!configHref?.includes('/admin/config.yml')) {
    issues.push('Expected the admin page to point at /admin/config.yml via rel="cms-config-url".');
  }

  for (const exposure of scanHighRiskSmokeExposure(probe.bodyText)) {
    issues.push(`Admin page exposed ${exposure}.`);
  }

  return {
    bodyTextSnippet: truncateForConsole(redactSensitiveSmokeText(probe.bodyText), 500),
    contentType: null,
    issues,
    kind: 'page',
    path: '/admin/#/',
    status: probe.status,
    title: probe.title,
    url,
  };
}

async function checkCheckoutShellPage(page: Page, options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck> {
  const url = createRouteUrl(options.siteUrl, `/store/${representativeStoreItemSlug}/checkout/`);
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
    path: `/store/${representativeStoreItemSlug}/checkout/`,
    status: probe.status,
    title: probe.title,
    url,
  };
}

async function checkCmsAssets(options: UatStaticSmokeOptions): Promise<UatStaticSmokeCheck[]> {
  const checks: UatStaticSmokeCheck[] = [];

  checks.push(await checkTextAsset(options, '/admin/config.yml', ['collections:', 'media_folder:']));
  checks.push(
    await checkTextAsset(options, '/admin/init.js', [
      'window.__BLACKBOX_ADMIN__',
      'blackbox-cms-preview-auto-collapsed',
    ]),
  );
  checks.push(await checkTextAsset(options, '/admin/admin.css', ['blackbox-cms']));
  checks.push(await checkTextAsset(options, '/admin/preview.css', ['body']));
  checks.push(await checkBinaryAsset(options, '/assets/images/brand/logo.png', 'image/'));
  checks.push(await checkBinaryAsset(options, '/favicon.svg', 'image/svg+xml'));

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
    ['/distro/', ['Distro']],
    ['/store/', ['Store']],
    [`/store/${representativeStoreItemSlug}/`, ['Disintegration', 'Add it to the cart']],
    ['/services/', ['Services']],
    ['/about/', ['About']],
  ] as const;

  for (const [routePath, expectedText] of routes) {
    const url = createRouteUrl(options.siteUrl, routePath);
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

    for (const exposure of scanHighRiskSmokeExposure(probe.bodyText)) {
      issues.push(`${routePath} exposed ${exposure}.`);
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
    return await fetch(url, { signal: controller.signal });
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
    checks: input.checks,
    consoleErrors: input.consoleErrors,
    environment: 'uat',
    generatedAt: new Date().toISOString(),
    pageErrors: input.pageErrors,
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

  if (text.includes('__SET_DECAPBRIDGE_SITE_ID__')) {
    issues.push('CMS config still contains the __SET_DECAPBRIDGE_SITE_ID__ placeholder.');
  }

  if (/https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/i.test(text)) {
    issues.push('CMS config still points at a local backend or loopback URL.');
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
