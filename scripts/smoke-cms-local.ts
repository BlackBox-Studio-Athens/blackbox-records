import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

import { CmsSmokeLifecycle, type CmsSmokeProcess } from './cms-smoke-lifecycle';
import { attachSmokePageDiagnostics, captureSmokePageScreenshot } from './smoke-browser';
import {
  createRouteUrl,
  createRunId,
  createSmokeEvidencePath,
  createSmokeScenarioArtifactDir,
  createSmokeSummaryPath,
  normalizeBaseUrl,
  parsePositiveInteger,
  parseRequiredValue,
  parseScreenshotMode,
  redactSensitiveSmokeText,
  writeJsonFile,
  type SmokeScreenshotMode,
} from './smoke-core';

declare global {
  interface Window {
    __BLACKBOX_CMS_SMOKE_PUBLISH_CLICKS__: number;
  }
}

export type CmsLocalSmokeOptions = {
  cmsPort: number;
  evidenceDir: string;
  headed: boolean;
  proxyPort: number;
  screenshots: SmokeScreenshotMode;
  timeoutMs: number;
};

type CmsCollectionName = 'artists' | 'distro' | 'home' | 'news' | 'releases';

type CmsEditorCheck = {
  collection: CmsCollectionName;
  entry: string;
  expectedFormValues: string[];
  issues: string[];
  minimumSectionCount: number;
  path: string;
  screenshotPath: string | null;
  snapshot: CmsEditorSnapshot | null;
  status: 'failed' | 'passed';
  url: string;
};

type CmsEditorSnapshot = {
  bodyTextSnippet: string;
  formValues: string[];
  hasDirectPublishNotice: boolean;
  hasEmptyContentGuard: boolean;
  hasGroupBrowseAffordance: boolean;
  hasHiddenTopLevelMedia: boolean;
  hasLoadedEditorChrome: boolean;
  hasLockedFixedSections: boolean;
  hasScopePanel: boolean;
  hash: string;
  hiddenFixedSectionActionCount: number;
  preview: CmsPreviewSnapshot;
  publishClickCount: number;
  sectionCounts: number[];
  title: string;
};

type CmsPreviewSnapshot = {
  ariaExpanded: string | null;
  ariaLabel: string | null;
  focusedAfterOpen: boolean;
  imageAlt: string | null;
  imageLoaded: boolean;
  imageSrc: string | null;
  initialState: string | null;
  templateFound: boolean;
};

type CmsReadOnlyState = {
  contentHash: string;
  gitHead: string;
};

type CmsLocalSmokeEvidence = {
  checks: CmsEditorCheck[];
  consoleErrors: string[];
  environment: 'local';
  generatedAt: string;
  pageErrors: string[];
  processOutput: Record<string, string[]>;
  proxyUrl: string;
  readOnly: {
    after: CmsReadOnlyState;
    before: CmsReadOnlyState;
    externalMutationRequests: string[];
    issues: string[];
    publishClickCount: number;
  };
  siteUrl: string;
  shutdown: {
    browserConnected: boolean;
    listeningPorts: number[];
    runningPids: number[];
  };
  status: 'failed' | 'passed';
  stoppedProcesses: boolean;
  suite: 'cms-local';
};

type CmsEditorDefinition = {
  collection: CmsCollectionName;
  entry: string;
  expectedFormValues: string[];
  expectedImageAlt: string;
  minimumSectionCount: number;
  previewClassName: string;
  requiredBodyText: string[];
  verifyGroupBrowse?: boolean;
  verifyLockedSections?: boolean;
};

const defaultOptions: CmsLocalSmokeOptions = {
  cmsPort: 4323,
  evidenceDir: path.join('.codex-artifacts', 'smoke', 'local', 'cms'),
  headed: false,
  proxyPort: 8083,
  screenshots: 'on-failure',
  timeoutMs: 90_000,
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(repoRoot, 'apps', 'web');
const contentRoot = path.join(webRoot, 'src', 'content');
const editorDefinitions: readonly CmsEditorDefinition[] = [
  {
    collection: 'home',
    entry: 'home-site',
    expectedFormValues: ['Fine music on record.'],
    expectedImageAlt: 'Black and white live band performing on stage',
    minimumSectionCount: 2,
    previewClassName: 'blackbox-preview--home',
    requiredBodyText: ['Publish writes to main'],
    verifyLockedSections: true,
  },
  {
    collection: 'artists',
    entry: 'chronoboros',
    expectedFormValues: ['Chronoboros', 'Hardcore'],
    expectedImageAlt: 'Black-and-white samurai mask illustration used for Chronoboros',
    minimumSectionCount: 0,
    previewClassName: 'blackbox-preview--artist',
    requiredBodyText: ['Image'],
  },
  {
    collection: 'releases',
    entry: 'caregivers',
    expectedFormValues: ['Caregivers'],
    expectedImageAlt: 'Cropped black samurai mask illustration on the pale Caregivers cover',
    minimumSectionCount: 0,
    previewClassName: 'blackbox-preview--release',
    requiredBodyText: ['Artist', 'Chronoboros'],
  },
  {
    collection: 'distro',
    entry: 'barren-point',
    expectedFormValues: ['Barren Point'],
    expectedImageAlt: 'Stack of vinyl records',
    minimumSectionCount: 0,
    previewClassName: 'blackbox-preview--distro',
    requiredBodyText: ['Group', 'Vinyl 12-inch'],
    verifyGroupBrowse: true,
  },
  {
    collection: 'news',
    entry: 'lorem-ipsum',
    expectedFormValues: ['New Release: Caregivers, by Chronoboros'],
    expectedImageAlt: 'Caregivers record sleeve photographed among dry leaves',
    minimumSectionCount: 0,
    previewClassName: 'blackbox-preview--news',
    requiredBodyText: ['Image'],
  },
];

export function parseCmsLocalSmokeArgs(args: string[]): CmsLocalSmokeOptions {
  const options = { ...defaultOptions };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--') {
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: pnpm smoke:cms-local -- [--cms-port <port>] [--proxy-port <port>] [--timeout-ms <ms>] [--evidence-dir <dir>] [--screenshots on-failure|always|never] [--headed]',
      );
      process.exit(0);
    }

    if (arg === '--cms-port') {
      options.cmsPort = parsePositiveInteger(args[index + 1], '--cms-port');
      index += 1;
      continue;
    }

    if (arg?.startsWith('--cms-port=')) {
      options.cmsPort = parsePositiveInteger(arg.slice('--cms-port='.length), '--cms-port');
      continue;
    }

    if (arg === '--proxy-port') {
      options.proxyPort = parsePositiveInteger(args[index + 1], '--proxy-port');
      index += 1;
      continue;
    }

    if (arg?.startsWith('--proxy-port=')) {
      options.proxyPort = parsePositiveInteger(arg.slice('--proxy-port='.length), '--proxy-port');
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

export async function runCmsLocalSmoke(options: CmsLocalSmokeOptions): Promise<CmsLocalSmokeEvidence> {
  const runId = createRunId();
  const runArtifactDir = path.join(options.evidenceDir, runId);
  const siteUrl = normalizeBaseUrl(`http://127.0.0.1:${options.cmsPort}/blackbox-records`, 'siteUrl');
  const proxyUrl = normalizeBaseUrl(`http://127.0.0.1:${options.proxyPort}/api/v1`, 'proxyUrl');
  const lifecycle = new CmsSmokeLifecycle();
  const before = captureCmsReadOnlyState();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let evidence: CmsLocalSmokeEvidence;

  mkdirSync(runArtifactDir, { recursive: true });
  lifecycle.installProcessHandlers();

  try {
    startCmsProcesses(options, lifecycle);
    await lifecycle.race(
      waitForLocalCmsReady({
        lifecycle,
        options,
        proxyUrl,
        siteUrl,
      }),
    );

    browser = await lifecycle.race(chromium.launch({ headless: !options.headed }));
    lifecycle.registerCleanup('Chromium browser', () => browser?.close());
    context = await lifecycle.race(
      browser.newContext({
        locale: 'en-US',
        viewport: { height: 900, width: 1440 },
      }),
    );
    lifecycle.registerCleanup('Playwright context', () => context?.close());
    await context.addInitScript(() => {
      window.__BLACKBOX_CMS_SMOKE_PUBLISH_CLICKS__ = 0;
      document.addEventListener(
        'click',
        (event) => {
          const target = event.target instanceof Element ? event.target.closest('button, [role="button"]') : null;
          if (target?.textContent?.replace(/\s+/g, ' ').trim() === 'Publish') {
            window.__BLACKBOX_CMS_SMOKE_PUBLISH_CLICKS__ += 1;
          }
        },
        true,
      );
    });
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const externalMutationRequests: string[] = [];
    context.on('request', (request) => {
      const method = request.method().toUpperCase();
      const url = new URL(request.url());
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !['127.0.0.1', 'localhost'].includes(url.hostname)) {
        externalMutationRequests.push(`${method} ${url.origin}${url.pathname}`);
      }
    });

    const checks = await lifecycle.race(
      (async () => {
        const results: CmsEditorCheck[] = [];
        for (const definition of editorDefinitions) {
          results.push(
            await checkEditorInFreshPage({
              consoleErrors,
              context: context!,
              definition,
              options,
              pageErrors,
              runArtifactDir,
              siteUrl,
            }),
          );
        }
        return results;
      })(),
    );
    lifecycle.assertHealthy();

    const after = captureCmsReadOnlyState();
    const publishClickCount = checks.reduce((count, check) => count + (check.snapshot?.publishClickCount ?? 0), 0);
    const readOnlyIssues = checkCmsReadOnlyInvariants({
      after,
      before,
      externalMutationRequests,
      publishClickCount,
    });

    const status =
      checks.some((check) => check.status === 'failed') ||
      consoleErrors.length ||
      pageErrors.length ||
      readOnlyIssues.length
        ? 'failed'
        : 'passed';
    evidence = {
      checks,
      consoleErrors,
      environment: 'local',
      generatedAt: new Date().toISOString(),
      pageErrors,
      processOutput: {},
      proxyUrl,
      readOnly: {
        after,
        before,
        externalMutationRequests,
        issues: readOnlyIssues,
        publishClickCount,
      },
      siteUrl,
      shutdown: { browserConnected: true, listeningPorts: [], runningPids: [] },
      status,
      stoppedProcesses: false,
      suite: 'cms-local',
    };
  } finally {
    await lifecycle.shutdown();
  }

  evidence.processOutput = buildProcessOutput(lifecycle.processes);
  evidence.shutdown = {
    browserConnected: browser?.isConnected() ?? false,
    listeningPorts: (
      await Promise.all(
        [options.cmsPort, options.proxyPort].map(async (port) => ((await isTcpPortListening(port)) ? port : null)),
      )
    ).filter((port): port is number => port !== null),
    runningPids: lifecycle.getRunningPids(),
  };
  evidence.stoppedProcesses =
    !evidence.shutdown.browserConnected &&
    evidence.shutdown.listeningPorts.length === 0 &&
    evidence.shutdown.runningPids.length === 0;
  if (!evidence.stoppedProcesses) {
    evidence.status = 'failed';
    evidence.readOnly.issues.push('Expected Astro and decap-server processes to stop before evidence was written.');
  }

  writeJsonFile(createSmokeEvidencePath(createSmokeScenarioArtifactDir(runArtifactDir, 'editor-read-only')), evidence);
  writeJsonFile(createSmokeSummaryPath(runArtifactDir), {
    generatedAt: evidence.generatedAt,
    runId,
    status: evidence.status,
    suite: evidence.suite,
  });

  return evidence;
}

function startCmsProcesses(options: CmsLocalSmokeOptions, lifecycle: CmsSmokeLifecycle): void {
  const proxyExecutable = process.env.DECAP_SERVER_EXECUTABLE?.trim() || resolveWebBin('decap-server');
  const astroExecutable = resolveWebBin('astro');
  const sharedEnv: NodeJS.ProcessEnv = {
    ...process.env,
    ASTRO_DEV_BACKGROUND: '0',
    ASTRO_BASE_PATH: '/blackbox-records/',
    ASTRO_SITE_URL: `http://127.0.0.1:${options.cmsPort}`,
    CMS_DEV_PORT: String(options.cmsPort),
    DECAP_BACKEND_MODE: 'local',
    DECAP_BRANCH: 'main',
    DECAP_LOCAL_PROXY_PORT: String(options.proxyPort),
  };

  for (const hostedSettingName of [
    'DECAP_REPOSITORY',
    'DECAP_SITE_URL',
    'DECAPBRIDGE_AUTH_ENDPOINT',
    'DECAPBRIDGE_AUTH_TOKEN_ENDPOINT',
    'DECAPBRIDGE_BASE_URL',
    'DECAPBRIDGE_GATEWAY_URL',
  ]) {
    delete sharedEnv[hostedSettingName];
  }

  lifecycle.startProcess({
    args: [],
    command: proxyExecutable,
    cwd: repoRoot,
    env: {
      ...sharedEnv,
      PORT: String(options.proxyPort),
    },
    name: 'decap-server',
  });
  lifecycle.startProcess({
    args: ['dev', '--host', '127.0.0.1', '--port', String(options.cmsPort)],
    command: astroExecutable,
    cwd: webRoot,
    env: sharedEnv,
    name: 'astro-dev',
  });
}

function resolveWebBin(name: string): string {
  const executableName = process.platform === 'win32' ? `${name}.cmd` : name;
  return path.join(webRoot, 'node_modules', '.bin', executableName);
}

async function waitForLocalCmsReady(input: {
  lifecycle: CmsSmokeLifecycle;
  options: CmsLocalSmokeOptions;
  proxyUrl: string;
  siteUrl: string;
}): Promise<void> {
  await waitForHttpReachable(input.proxyUrl, input.options.timeoutMs, input.lifecycle);

  const configUrl = createRouteUrl(input.siteUrl, '/admin/config.yml');
  const configText = await waitForHttpText(configUrl, input.options.timeoutMs, input.lifecycle);

  const expectedProxyUrl = `http://127.0.0.1:${input.options.proxyPort}/api/v1`;
  const missingConfigSnippets = [
    'backend:',
    'name: proxy',
    'extension: json',
    'format: json',
    'media_folder: "apps/web/src/content/home"',
    'public_folder: "./"',
    'file: "apps/web/src/content/home/site.json"',
    'folder: "apps/web/src/content/releases"',
    expectedProxyUrl,
  ].filter((snippet) => !configText.includes(snippet));

  if (missingConfigSnippets.length) {
    throw new Error(`Local CMS config missed expected snippets: ${missingConfigSnippets.join(', ')}.`);
  }

  if (/file: "src\/content\/|folder: "src\/content\/|media_folder: src\/content\//.test(configText)) {
    throw new Error(
      'Local CMS config still uses app-root src/content paths; remote DecapBridge needs repo-root paths.',
    );
  }
}

async function waitForHttpReachable(url: string, timeoutMs: number, lifecycle: CmsSmokeLifecycle): Promise<void> {
  await waitUntil(timeoutMs, lifecycle, async () => {
    const response = await fetch(url).catch(() => null);
    return Boolean(response);
  });
}

async function waitForHttpText(url: string, timeoutMs: number, lifecycle: CmsSmokeLifecycle): Promise<string> {
  let text = '';

  await waitUntil(timeoutMs, lifecycle, async () => {
    const response = await fetch(url).catch(() => null);
    if (!response?.ok) {
      return false;
    }

    text = await response.text();
    return Boolean(text);
  });

  return text;
}

async function waitUntil(
  timeoutMs: number,
  lifecycle: CmsSmokeLifecycle,
  predicate: () => Promise<boolean>,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    lifecycle.assertHealthy();

    if (await predicate()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for local CMS readiness.`);
}

async function checkEditor(input: {
  definition: CmsEditorDefinition;
  options: CmsLocalSmokeOptions;
  page: Page;
  runArtifactDir: string;
  siteUrl: string;
}): Promise<CmsEditorCheck> {
  const { definition } = input;
  const pathName = `/admin/#/collections/${definition.collection}/entries/${definition.entry}`;
  const url = createRouteUrl(input.siteUrl, pathName);
  const scenarioArtifactDir = createSmokeScenarioArtifactDir(input.runArtifactDir, definition.collection);
  const issues: string[] = [];
  let hasGroupBrowseAffordance = false;

  mkdirSync(scenarioArtifactDir, { recursive: true });

  if (definition.verifyGroupBrowse) {
    await input.page.goto(createRouteUrl(input.siteUrl, `/admin/#/collections/${definition.collection}`), {
      timeout: Math.min(input.options.timeoutMs, 30_000),
      waitUntil: 'domcontentloaded',
    });
    await clickLocalDecapLogin(input.page);
    hasGroupBrowseAffordance = await input.page
      .waitForFunction(() => /\bGroup\b/i.test(document.body?.innerText || ''), undefined, {
        timeout: Math.min(input.options.timeoutMs, 20_000),
      })
      .then(() => true)
      .catch(() => false);
    if (!hasGroupBrowseAffordance) {
      issues.push('Expected Distro collection browsing to expose the configured Group affordance.');
    }
  }

  await input.page.goto(url, {
    timeout: Math.min(input.options.timeoutMs, 30_000),
    waitUntil: 'domcontentloaded',
  });
  await input.page.waitForLoadState('networkidle', { timeout: Math.min(input.options.timeoutMs, 10_000) }).catch(() => {
    // Decap keeps background requests open during editor boot.
  });

  await clickLocalDecapLogin(input.page);

  await input.page
    .waitForFunction(
      () => {
        const bodyText = document.body?.innerText || '';
        return /\bWriting in\b.+\bcollection\b/i.test(bodyText);
      },
      undefined,
      { timeout: Math.min(input.options.timeoutMs, 25_000) },
    )
    .catch((error: unknown) => {
      issues.push(
        `Expected ${definition.collection} editor chrome to load: ${redactSensitiveSmokeText(String(error))}.`,
      );
    });

  await input.page
    .waitForFunction(
      ({ expectedFormValues, minimumSectionCount }) => {
        const bodyText = document.body?.innerText || '';
        const formValues = Array.from(document.querySelectorAll('input, textarea'))
          .map((element) =>
            element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value.trim() : '',
          )
          .filter(Boolean);
        const sectionCounts = Array.from(bodyText.matchAll(/\b(\d+)\s+sections\b/gi)).map((match) => Number(match[1]));
        const hasLoadedEditorChrome = /\bWriting in\b.+\bcollection\b/i.test(bodyText);
        const hasExpectedValues = expectedFormValues.every((value) =>
          formValues.some((formValue) => formValue.includes(value)),
        );
        const maxSectionCount = Math.max(0, ...sectionCounts);

        return hasLoadedEditorChrome && hasExpectedValues && maxSectionCount >= minimumSectionCount;
      },
      {
        expectedFormValues: definition.expectedFormValues,
        minimumSectionCount: definition.minimumSectionCount,
      },
      { timeout: Math.min(input.options.timeoutMs, 25_000) },
    )
    .catch((error: unknown) => {
      issues.push(
        `Expected ${definition.collection} editor to show existing content: ${redactSensitiveSmokeText(String(error))}.`,
      );
    });

  if (definition.verifyLockedSections) {
    await input.page
      .waitForFunction(
        () => {
          const bars = Array.from(
            document.querySelectorAll<HTMLElement>('[data-blackbox-fixed-section-actions="locked"]'),
          );
          return (
            bars.length > 0 &&
            bars.some((bar) => bar.querySelectorAll('[hidden][aria-hidden="true"][tabindex="-1"]').length > 0)
          );
        },
        undefined,
        { timeout: Math.min(input.options.timeoutMs, 5_000) },
      )
      .catch((error: unknown) => {
        issues.push(`Expected Home fixed-list controls to settle: ${redactSensitiveSmokeText(String(error))}.`);
      });
  }

  const snapshot = await readCmsEditorSnapshot(input.page, hasGroupBrowseAffordance);
  snapshot.preview = await checkCmsPreview(input.page, definition, input.options.timeoutMs);
  const missingFormValues = definition.expectedFormValues.filter(
    (value) => !snapshot.formValues.some((formValue) => formValue.includes(value)),
  );
  const maxSectionCount = Math.max(0, ...snapshot.sectionCounts);

  if (!snapshot.hasLoadedEditorChrome) {
    issues.push(`Expected ${definition.collection} editor to show the loaded Decap editor chrome.`);
  }

  for (const missingValue of missingFormValues) {
    issues.push(`Expected ${definition.collection} form values to include "${missingValue}".`);
  }

  for (const requiredText of definition.requiredBodyText) {
    if (!snapshot.bodyTextSnippet.toLowerCase().includes(requiredText.toLowerCase())) {
      issues.push(`Expected ${definition.collection} editor text to include "${requiredText}".`);
    }
  }

  if (maxSectionCount < definition.minimumSectionCount) {
    issues.push(
      `Expected ${definition.collection} sections count to be at least ${definition.minimumSectionCount}; received ${maxSectionCount}.`,
    );
  }

  if (/\b0\s+sections\b/i.test(snapshot.bodyTextSnippet) && definition.minimumSectionCount > 0) {
    issues.push(`Expected ${definition.collection} editor not to render the empty "0 sections" state.`);
  }

  if (snapshot.hasEmptyContentGuard) {
    issues.push(`Expected ${definition.collection} editor not to show the singleton empty-content recovery guard.`);
  }

  if (!snapshot.hasScopePanel || !snapshot.hasDirectPublishNotice) {
    issues.push(`Expected ${definition.collection} editor to show direct-to-main publishing and scope guidance.`);
  }

  if (!snapshot.hasHiddenTopLevelMedia) {
    issues.push(`Expected ${definition.collection} editor to keep the misleading top-level Media action hidden.`);
  }

  if (
    definition.verifyLockedSections &&
    (!snapshot.hasLockedFixedSections || !snapshot.hiddenFixedSectionActionCount)
  ) {
    issues.push('Expected Home fixed-layout section controls to stay locked and hidden.');
  }

  if (definition.verifyGroupBrowse && !snapshot.hasGroupBrowseAffordance) {
    issues.push('Expected Distro group browsing evidence to remain present in the editor snapshot.');
  }

  if (snapshot.preview.initialState !== 'closed') {
    issues.push(`Expected ${definition.collection} preview to start collapsed.`);
  }

  if (snapshot.preview.ariaExpanded !== 'false' || !snapshot.preview.ariaLabel?.startsWith('Open preview')) {
    issues.push(
      `Expected ${definition.collection} collapsed preview toggle to expose accessible state and action copy.`,
    );
  }

  if (!snapshot.preview.focusedAfterOpen) {
    issues.push(`Expected ${definition.collection} preview toggle to retain focus after opening.`);
  }

  if (!snapshot.preview.templateFound) {
    issues.push(`Expected ${definition.collection} registered preview template to render.`);
  }

  if (!snapshot.preview.imageLoaded || snapshot.preview.imageAlt !== definition.expectedImageAlt) {
    issues.push(`Expected ${definition.collection} preview image to load with its current accessible alt text.`);
  }

  if (snapshot.publishClickCount !== 0) {
    issues.push(`Expected ${definition.collection} smoke check never to select Publish.`);
  }

  const status = issues.length ? 'failed' : 'passed';
  const screenshotPath = await maybeCaptureCmsScreenshot(
    input.page,
    scenarioArtifactDir,
    status === 'failed',
    input.options.screenshots,
  );

  return {
    collection: definition.collection,
    entry: definition.entry,
    expectedFormValues: definition.expectedFormValues,
    issues,
    minimumSectionCount: definition.minimumSectionCount,
    path: pathName,
    screenshotPath,
    snapshot,
    status,
    url,
  };
}

async function checkEditorInFreshPage(input: {
  consoleErrors: string[];
  context: BrowserContext;
  definition: CmsEditorDefinition;
  options: CmsLocalSmokeOptions;
  pageErrors: string[];
  runArtifactDir: string;
  siteUrl: string;
}): Promise<CmsEditorCheck> {
  const page = await input.context.newPage();
  const diagnostics = attachSmokePageDiagnostics(page);
  page.setDefaultTimeout(input.options.timeoutMs);

  try {
    return await checkEditor({
      definition: input.definition,
      options: input.options,
      page,
      runArtifactDir: input.runArtifactDir,
      siteUrl: input.siteUrl,
    });
  } finally {
    input.consoleErrors.push(...diagnostics.consoleErrors);
    input.pageErrors.push(...diagnostics.pageErrors);
    diagnostics.dispose();
    await page.close();
  }
}

async function clickLocalDecapLogin(page: Page): Promise<void> {
  const bodyText = await page
    .locator('body')
    .innerText()
    .catch(() => '');
  if (/\bWriting in\b.+\bcollection\b/i.test(bodyText)) {
    return;
  }

  const loginButton = page
    .locator('[data-blackbox-cms-auth-button="true"], button', { hasText: /^(Login|Open local editor)$/i })
    .first();

  const loginReady = await loginButton
    .waitFor({ state: 'visible', timeout: 15_000 })
    .then(() => true)
    .catch(() => false);

  if (loginReady) {
    await loginButton.click({ timeout: 5_000 });
  }
}

async function readCmsEditorSnapshot(page: Page, hasGroupBrowseAffordance: boolean): Promise<CmsEditorSnapshot> {
  return page.evaluate((groupBrowseEvidence) => {
    const bodyText = document.body?.innerText || '';
    const formValues = Array.from(document.querySelectorAll('input, textarea'))
      .map((element) =>
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value.trim() : '',
      )
      .filter(Boolean);
    const sectionCounts = Array.from(bodyText.matchAll(/\b(\d+)\s+sections\b/gi)).map((match) => Number(match[1]));
    const fixedSectionBars = Array.from(
      document.querySelectorAll<HTMLElement>('[data-blackbox-fixed-section-actions="locked"]'),
    );
    const navMediaButton = Array.from(document.querySelectorAll<HTMLElement>('nav button')).find(
      (button) => button.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() === 'media',
    );
    const mediaButton = document.querySelector<HTMLElement>('[data-blackbox-top-level-media="hidden"]');
    const scopePanel = document.querySelector<HTMLElement>('[data-blackbox-cms-scope-panel="true"]');

    return {
      bodyTextSnippet: bodyText.replace(/\s+/g, ' ').trim().slice(0, 5_000),
      formValues,
      hasDirectPublishNotice: Boolean(scopePanel?.textContent?.includes('Publishing commits immediately to main')),
      hasEmptyContentGuard: Boolean(document.querySelector('[data-blackbox-cms-empty-guard="true"]')),
      hasGroupBrowseAffordance: groupBrowseEvidence,
      hasHiddenTopLevelMedia:
        !navMediaButton || Boolean(mediaButton?.hidden && mediaButton.getAttribute('aria-hidden') === 'true'),
      hasLoadedEditorChrome: /\bWriting in\b.+\bcollection\b/i.test(bodyText),
      hasLockedFixedSections: fixedSectionBars.length > 0,
      hasScopePanel: Boolean(scopePanel),
      hash: window.location.hash,
      hiddenFixedSectionActionCount: fixedSectionBars.reduce(
        (count, bar) => count + bar.querySelectorAll('[hidden][aria-hidden="true"][tabindex="-1"]').length,
        0,
      ),
      preview: {
        ariaExpanded: null,
        ariaLabel: null,
        focusedAfterOpen: false,
        imageAlt: null,
        imageLoaded: false,
        imageSrc: null,
        initialState: null,
        templateFound: false,
      },
      publishClickCount: window.__BLACKBOX_CMS_SMOKE_PUBLISH_CLICKS__ || 0,
      sectionCounts,
      title: document.title,
    };
  }, hasGroupBrowseAffordance);
}

async function checkCmsPreview(
  page: Page,
  definition: CmsEditorDefinition,
  timeoutMs: number,
): Promise<CmsPreviewSnapshot> {
  const toggle = page.locator('button[data-blackbox-preview-toggle="true"]').first();
  const isVisible = await toggle
    .waitFor({ state: 'visible', timeout: Math.min(timeoutMs, 20_000) })
    .then(() => true)
    .catch(() => false);

  if (!isVisible) {
    return {
      ariaExpanded: null,
      ariaLabel: null,
      focusedAfterOpen: false,
      imageAlt: null,
      imageLoaded: false,
      imageSrc: null,
      initialState: null,
      templateFound: false,
    };
  }

  const initialState = await toggle.getAttribute('data-preview-state');
  const ariaExpanded = await toggle.getAttribute('aria-expanded');
  const ariaLabel = await toggle.getAttribute('aria-label');

  await page
    .waitForFunction(
      () => {
        const previewToggle = document.querySelector<HTMLButtonElement>('button[data-blackbox-preview-toggle="true"]');
        return (
          previewToggle?.dataset.previewState === 'closed' &&
          window.sessionStorage.getItem('blackbox-cms-preview-auto-collapsed') === 'true'
        );
      },
      undefined,
      { timeout: Math.min(timeoutMs, 5_000) },
    )
    .catch(() => undefined);

  const settledInitialState = await toggle.getAttribute('data-preview-state');
  const settledAriaExpanded = await toggle.getAttribute('aria-expanded');
  const settledAriaLabel = await toggle.getAttribute('aria-label');

  if (settledInitialState === 'open') {
    await toggle.click();
    await toggle
      .waitFor({ state: 'visible', timeout: Math.min(timeoutMs, 5_000) })
      .then(() =>
        page.waitForFunction(
          () =>
            document.querySelector<HTMLButtonElement>('button[data-blackbox-preview-toggle="true"]')?.dataset
              .previewState === 'closed',
          undefined,
          { timeout: Math.min(timeoutMs, 5_000) },
        ),
      )
      .catch(() => undefined);
  }

  await toggle.click();
  await page
    .waitForFunction(
      () => {
        const previewToggle = document.querySelector<HTMLButtonElement>('button[data-blackbox-preview-toggle="true"]');
        return previewToggle?.dataset.previewState === 'open' && previewToggle.ariaExpanded === 'true';
      },
      undefined,
      { timeout: Math.min(timeoutMs, 5_000) },
    )
    .catch(() => undefined);
  const focusedAfterOpen = await toggle.evaluate((element) => document.activeElement === element);
  const preview = await waitForPreviewTemplate(page, definition, timeoutMs);

  return {
    ariaExpanded: settledAriaExpanded ?? ariaExpanded,
    ariaLabel: settledAriaLabel ?? ariaLabel,
    focusedAfterOpen,
    imageAlt: preview.imageAlt,
    imageLoaded: preview.imageLoaded,
    imageSrc: preview.imageSrc,
    initialState: settledInitialState ?? initialState,
    templateFound: preview.templateFound,
  };
}

async function waitForPreviewTemplate(
  page: Page,
  definition: CmsEditorDefinition,
  timeoutMs: number,
): Promise<Pick<CmsPreviewSnapshot, 'imageAlt' | 'imageLoaded' | 'imageSrc' | 'templateFound'>> {
  const startedAt = Date.now();
  const template = page.frameLocator('iframe').locator(`.${definition.previewClassName}`);

  while (Date.now() - startedAt < Math.min(timeoutMs, 25_000)) {
    if ((await template.count()) === 1) {
      const snapshot = await template
        .evaluate((templateElement, expectedImageAlt) => {
          const images = Array.from(templateElement.querySelectorAll('img'));
          const image = images.find((candidate) => candidate.alt === expectedImageAlt) || images[0] || null;
          return {
            imageAlt: image?.alt || null,
            imageLoaded: Boolean(image?.complete && image.naturalWidth > 0),
            imageSrc: image?.currentSrc || image?.src || null,
            templateFound: true,
          };
        }, definition.expectedImageAlt)
        .catch(() => null);
      if (snapshot?.imageLoaded) return snapshot;
    }

    await page.waitForTimeout(150);
  }

  return { imageAlt: null, imageLoaded: false, imageSrc: null, templateFound: false };
}

async function maybeCaptureCmsScreenshot(
  page: Page,
  scenarioArtifactDir: string,
  hasIssues: boolean,
  mode: SmokeScreenshotMode,
): Promise<string | null> {
  if (mode === 'never' || (mode === 'on-failure' && !hasIssues)) {
    return null;
  }

  const screenshotPath = path.join(scenarioArtifactDir, hasIssues ? 'failure.png' : 'final.png');
  return captureSmokePageScreenshot(page, screenshotPath, true);
}

function buildProcessOutput(processes: CmsSmokeProcess[]): Record<string, string[]> {
  return Object.fromEntries(processes.map((processInfo) => [processInfo.name, processInfo.output]));
}

export function checkCmsReadOnlyInvariants(input: {
  after: CmsReadOnlyState;
  before: CmsReadOnlyState;
  externalMutationRequests: string[];
  publishClickCount: number;
}): string[] {
  const issues: string[] = [];
  if (input.before.contentHash !== input.after.contentHash)
    issues.push('CMS content files changed during the read-only smoke.');
  if (input.before.gitHead !== input.after.gitHead) issues.push('Git HEAD changed during the read-only smoke.');
  if (input.publishClickCount !== 0) issues.push('The read-only smoke selected Publish.');
  if (input.externalMutationRequests.length) {
    issues.push(`The read-only smoke sent external mutation requests: ${input.externalMutationRequests.join(', ')}.`);
  }
  return issues;
}

function captureCmsReadOnlyState(): CmsReadOnlyState {
  const hash = createHash('sha256');
  for (const filePath of listFilesRecursively(contentRoot)) {
    hash.update(path.relative(contentRoot, filePath).replace(/\\/g, '/'));
    hash.update('\0');
    hash.update(readFileSync(filePath));
    hash.update('\0');
  }

  const gitHead = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
    windowsHide: true,
  });
  if (gitHead.status !== 0 || !gitHead.stdout.trim()) throw new Error('Could not capture Git HEAD before CMS smoke.');

  return { contentHash: hash.digest('hex'), gitHead: gitHead.stdout.trim() };
}

function listFilesRecursively(directory: string): string[] {
  return readdirSync(directory)
    .flatMap((name) => {
      const absolutePath = path.join(directory, name);
      return statSync(absolutePath).isDirectory() ? listFilesRecursively(absolutePath) : [absolutePath];
    })
    .sort((left, right) => left.localeCompare(right));
}

async function isTcpPortListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    const finish = (isListening: boolean) => {
      socket.destroy();
      resolve(isListening);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(750, () => finish(false));
  });
}

async function main(): Promise<void> {
  const options = parseCmsLocalSmokeArgs(process.argv.slice(2));
  const evidence = await runCmsLocalSmoke(options);
  const summary = [
    `CMS local smoke: ${evidence.status.toUpperCase()}`,
    `- site: ${evidence.siteUrl}`,
    `- proxy: ${evidence.proxyUrl}`,
    `- checks: ${evidence.checks.length}`,
    `- console errors: ${evidence.consoleErrors.length}`,
    `- page errors: ${evidence.pageErrors.length}`,
  ].join('\n');

  console.log(summary);

  if (evidence.status === 'failed') {
    console.error(JSON.stringify(evidence, null, 2));
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(redactSensitiveSmokeText(error instanceof Error ? error.stack || error.message : String(error)));
    process.exitCode = 1;
  });
}
