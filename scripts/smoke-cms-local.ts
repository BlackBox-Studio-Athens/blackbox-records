import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

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

export type CmsLocalSmokeOptions = {
  cmsPort: number;
  evidenceDir: string;
  headed: boolean;
  proxyPort: number;
  screenshots: SmokeScreenshotMode;
  timeoutMs: number;
};

type ManagedProcess = {
  child: ChildProcess;
  name: string;
  output: string[];
};

type CmsEditorCheck = {
  collection: 'home' | 'about';
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
  hasEmptyContentGuard: boolean;
  hasLoadedEditorChrome: boolean;
  hash: string;
  sectionCounts: number[];
  title: string;
};

type CmsLocalSmokeEvidence = {
  checks: CmsEditorCheck[];
  consoleErrors: string[];
  environment: 'local';
  generatedAt: string;
  pageErrors: string[];
  processOutput: Record<string, string[]>;
  proxyUrl: string;
  siteUrl: string;
  status: 'failed' | 'passed';
  suite: 'cms-local';
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
  const processes = startCmsProcesses(options);
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  mkdirSync(runArtifactDir, { recursive: true });

  try {
    await waitForLocalCmsReady({
      options,
      processes,
      proxyUrl,
      siteUrl,
    });

    browser = await chromium.launch({ headless: !options.headed });
    context = await browser.newContext({
      locale: 'en-US',
      viewport: { height: 900, width: 1440 },
    });
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    const checks: CmsEditorCheck[] = [];
    checks.push(
      await checkSingletonEditorInFreshPage({
        collection: 'home',
        consoleErrors,
        context,
        entry: 'home-site',
        expectedFormValues: ['Fine music on record.'],
        minimumSectionCount: 1,
        options,
        pageErrors,
        runArtifactDir,
        siteUrl,
      }),
    );
    checks.push(
      await checkSingletonEditorInFreshPage({
        collection: 'about',
        consoleErrors,
        context,
        entry: 'about-site',
        expectedFormValues: ['The Label'],
        minimumSectionCount: 1,
        options,
        pageErrors,
        runArtifactDir,
        siteUrl,
      }),
    );
    checks.push(
      ...(await checkSingletonEditorRouteTransition({
        consoleErrors,
        context,
        options,
        pageErrors,
        runArtifactDir,
        siteUrl,
      })),
    );

    const status =
      checks.some((check) => check.status === 'failed') || consoleErrors.length || pageErrors.length
        ? 'failed'
        : 'passed';
    const evidence: CmsLocalSmokeEvidence = {
      checks,
      consoleErrors,
      environment: 'local',
      generatedAt: new Date().toISOString(),
      pageErrors,
      processOutput: buildProcessOutput(processes),
      proxyUrl,
      siteUrl,
      status,
      suite: 'cms-local',
    };

    writeJsonFile(
      createSmokeEvidencePath(createSmokeScenarioArtifactDir(runArtifactDir, 'singleton-editors')),
      evidence,
    );
    writeJsonFile(createSmokeSummaryPath(runArtifactDir), {
      generatedAt: evidence.generatedAt,
      runId,
      status,
      suite: evidence.suite,
    });

    return evidence;
  } finally {
    await context?.close();
    await browser?.close();
    stopCmsProcesses(processes);
  }
}

function startCmsProcesses(options: CmsLocalSmokeOptions): ManagedProcess[] {
  const proxyExecutable = resolveWebBin('decap-server');
  const astroExecutable = resolveWebBin('astro');
  const sharedEnv = {
    ...process.env,
    ASTRO_BASE_PATH: '/blackbox-records/',
    ASTRO_SITE_URL: `http://127.0.0.1:${options.cmsPort}`,
    CMS_DEV_PORT: String(options.cmsPort),
    DECAP_BRANCH: 'main',
    DECAP_LOCAL_PROXY_PORT: String(options.proxyPort),
  };

  return [
    spawnManagedProcess('decap-server', proxyExecutable, [], {
      cwd: webRoot,
      env: {
        ...sharedEnv,
        PORT: String(options.proxyPort),
      },
    }),
    spawnManagedProcess(
      'astro-dev',
      astroExecutable,
      ['dev', '--host', '127.0.0.1', '--port', String(options.cmsPort)],
      {
        cwd: webRoot,
        env: sharedEnv,
      },
    ),
  ];
}

function spawnManagedProcess(
  name: string,
  command: string,
  args: string[],
  spawnOptions: { cwd: string; env: NodeJS.ProcessEnv },
): ManagedProcess {
  const shouldUseShell = process.platform === 'win32';
  const child = spawn(shouldUseShell ? buildWindowsShellCommand(command, args) : command, shouldUseShell ? [] : args, {
    cwd: spawnOptions.cwd,
    env: spawnOptions.env,
    shell: shouldUseShell,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const managed: ManagedProcess = {
    child,
    name,
    output: [],
  };

  child.stdout?.on('data', (chunk: Buffer) => appendProcessOutput(managed, chunk));
  child.stderr?.on('data', (chunk: Buffer) => appendProcessOutput(managed, chunk));

  return managed;
}

function buildWindowsShellCommand(command: string, args: string[]): string {
  return [command, ...args].map(quoteWindowsShellArg).join(' ');
}

function quoteWindowsShellArg(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function appendProcessOutput(processInfo: ManagedProcess, chunk: Buffer): void {
  const text = redactSensitiveSmokeText(chunk.toString('utf8'));
  processInfo.output.push(...text.split(/\r?\n/).filter(Boolean));
  processInfo.output = processInfo.output.slice(-80);
}

function resolveWebBin(name: string): string {
  const executableName = process.platform === 'win32' ? `${name}.cmd` : name;
  return path.join(webRoot, 'node_modules', '.bin', executableName);
}

async function waitForLocalCmsReady(input: {
  options: CmsLocalSmokeOptions;
  processes: ManagedProcess[];
  proxyUrl: string;
  siteUrl: string;
}): Promise<void> {
  await waitForHttpReachable(input.proxyUrl, input.options.timeoutMs, input.processes);

  const configUrl = createRouteUrl(input.siteUrl, '/admin/config.yml');
  const configText = await waitForHttpText(configUrl, input.options.timeoutMs, input.processes);

  const expectedProxyUrl = `http://127.0.0.1:${input.options.proxyPort}/api/v1`;
  const missingConfigSnippets = ['backend:', 'name: proxy', 'extension: json', 'format: json', expectedProxyUrl].filter(
    (snippet) => !configText.includes(snippet),
  );

  if (missingConfigSnippets.length) {
    throw new Error(`Local CMS config missed expected snippets: ${missingConfigSnippets.join(', ')}.`);
  }
}

async function waitForHttpReachable(url: string, timeoutMs: number, processes: ManagedProcess[]): Promise<void> {
  await waitUntil(timeoutMs, processes, async () => {
    const response = await fetch(url).catch(() => null);
    return Boolean(response);
  });
}

async function waitForHttpText(url: string, timeoutMs: number, processes: ManagedProcess[]): Promise<string> {
  let text = '';

  await waitUntil(timeoutMs, processes, async () => {
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
  processes: ManagedProcess[],
  predicate: () => Promise<boolean>,
): Promise<void> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    throwIfProcessExited(processes);

    if (await predicate()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out after ${timeoutMs}ms waiting for local CMS readiness.`);
}

function throwIfProcessExited(processes: ManagedProcess[]): void {
  const exitedProcess = processes.find((processInfo) => processInfo.child.exitCode !== null);

  if (!exitedProcess) {
    return;
  }

  throw new Error(
    `${exitedProcess.name} exited with code ${exitedProcess.child.exitCode}.\n${exitedProcess.output.join('\n')}`,
  );
}

async function checkSingletonEditor(input: {
  collection: 'home' | 'about';
  entry: string;
  expectedFormValues: string[];
  minimumSectionCount: number;
  options: CmsLocalSmokeOptions;
  page: Page;
  runArtifactDir: string;
  siteUrl: string;
}): Promise<CmsEditorCheck> {
  const pathName = `/admin/#/collections/${input.collection}/entries/${input.entry}`;
  const url = createRouteUrl(input.siteUrl, pathName);
  const scenarioArtifactDir = createSmokeScenarioArtifactDir(input.runArtifactDir, input.collection);
  const issues: string[] = [];

  mkdirSync(scenarioArtifactDir, { recursive: true });

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
      (collection) => {
        const bodyText = document.body?.innerText || '';
        return bodyText.includes(`Writing in ${collection[0].toUpperCase()}${collection.slice(1)} collection`);
      },
      input.collection,
      { timeout: Math.min(input.options.timeoutMs, 25_000) },
    )
    .catch((error: unknown) => {
      issues.push(`Expected ${input.collection} editor chrome to load: ${redactSensitiveSmokeText(String(error))}.`);
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
        expectedFormValues: input.expectedFormValues,
        minimumSectionCount: input.minimumSectionCount,
      },
      { timeout: Math.min(input.options.timeoutMs, 25_000) },
    )
    .catch((error: unknown) => {
      issues.push(
        `Expected ${input.collection} editor to show existing JSON content: ${redactSensitiveSmokeText(String(error))}.`,
      );
    });

  const snapshot = await readCmsEditorSnapshot(input.page);
  const missingFormValues = input.expectedFormValues.filter(
    (value) => !snapshot.formValues.some((formValue) => formValue.includes(value)),
  );
  const maxSectionCount = Math.max(0, ...snapshot.sectionCounts);

  if (!snapshot.hasLoadedEditorChrome) {
    issues.push(`Expected ${input.collection} editor to show the loaded Decap editor chrome.`);
  }

  for (const missingValue of missingFormValues) {
    issues.push(`Expected ${input.collection} form values to include "${missingValue}".`);
  }

  if (maxSectionCount < input.minimumSectionCount) {
    issues.push(
      `Expected ${input.collection} sections count to be at least ${input.minimumSectionCount}; received ${maxSectionCount}.`,
    );
  }

  if (/\b0\s+sections\b/i.test(snapshot.bodyTextSnippet) && input.minimumSectionCount > 0) {
    issues.push(`Expected ${input.collection} editor not to render the empty "0 sections" state.`);
  }

  if (snapshot.hasEmptyContentGuard) {
    issues.push(`Expected ${input.collection} editor not to show the singleton empty-content recovery guard.`);
  }

  const status = issues.length ? 'failed' : 'passed';
  const screenshotPath = await maybeCaptureCmsScreenshot(
    input.page,
    scenarioArtifactDir,
    status === 'failed',
    input.options.screenshots,
  );

  return {
    collection: input.collection,
    entry: input.entry,
    expectedFormValues: input.expectedFormValues,
    issues,
    minimumSectionCount: input.minimumSectionCount,
    path: pathName,
    screenshotPath,
    snapshot,
    status,
    url,
  };
}

async function checkSingletonEditorInFreshPage(input: {
  collection: 'home' | 'about';
  consoleErrors: string[];
  context: BrowserContext;
  entry: string;
  expectedFormValues: string[];
  minimumSectionCount: number;
  options: CmsLocalSmokeOptions;
  pageErrors: string[];
  runArtifactDir: string;
  siteUrl: string;
}): Promise<CmsEditorCheck> {
  const page = await input.context.newPage();
  const diagnostics = attachSmokePageDiagnostics(page);
  page.setDefaultTimeout(input.options.timeoutMs);

  try {
    return await checkSingletonEditor({
      collection: input.collection,
      entry: input.entry,
      expectedFormValues: input.expectedFormValues,
      minimumSectionCount: input.minimumSectionCount,
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

async function checkSingletonEditorRouteTransition(input: {
  consoleErrors: string[];
  context: BrowserContext;
  options: CmsLocalSmokeOptions;
  pageErrors: string[];
  runArtifactDir: string;
  siteUrl: string;
}): Promise<CmsEditorCheck[]> {
  const page = await input.context.newPage();
  const diagnostics = attachSmokePageDiagnostics(page);
  page.setDefaultTimeout(input.options.timeoutMs);

  try {
    return [
      await checkSingletonEditor({
        collection: 'home',
        entry: 'home-site',
        expectedFormValues: ['Fine music on record.'],
        minimumSectionCount: 1,
        options: input.options,
        page,
        runArtifactDir: input.runArtifactDir,
        siteUrl: input.siteUrl,
      }),
      await checkSingletonEditor({
        collection: 'about',
        entry: 'about-site',
        expectedFormValues: ['The Label'],
        minimumSectionCount: 1,
        options: input.options,
        page,
        runArtifactDir: input.runArtifactDir,
        siteUrl: input.siteUrl,
      }),
    ];
  } finally {
    input.consoleErrors.push(...diagnostics.consoleErrors);
    input.pageErrors.push(...diagnostics.pageErrors);
    diagnostics.dispose();
    await page.close();
  }
}

async function clickLocalDecapLogin(page: Page): Promise<void> {
  const loginButton = page
    .locator('[data-blackbox-cms-auth-button="true"], button', {
      hasText: /^(Sign in with DecapBridge|Login)$/i,
    })
    .first();

  if ((await loginButton.count()) === 0) {
    return;
  }

  await loginButton.click({ timeout: 5_000 }).catch(() => {
    // Auth may already have advanced between the count and click.
  });
}

async function readCmsEditorSnapshot(page: Page): Promise<CmsEditorSnapshot> {
  return page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    const formValues = Array.from(document.querySelectorAll('input, textarea'))
      .map((element) =>
        element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement ? element.value.trim() : '',
      )
      .filter(Boolean);
    const sectionCounts = Array.from(bodyText.matchAll(/\b(\d+)\s+sections\b/gi)).map((match) => Number(match[1]));

    return {
      bodyTextSnippet: bodyText.replace(/\s+/g, ' ').trim().slice(0, 1_500),
      formValues,
      hasEmptyContentGuard: Boolean(document.querySelector('[data-blackbox-cms-empty-guard="true"]')),
      hasLoadedEditorChrome: /\bWriting in\b.+\bcollection\b/i.test(bodyText),
      hash: window.location.hash,
      sectionCounts,
      title: document.title,
    };
  });
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

function buildProcessOutput(processes: ManagedProcess[]): Record<string, string[]> {
  return Object.fromEntries(processes.map((processInfo) => [processInfo.name, processInfo.output]));
}

function stopCmsProcesses(processes: ManagedProcess[]): void {
  for (const processInfo of processes) {
    if (!processInfo.child.pid || processInfo.child.killed) {
      continue;
    }

    if (process.platform === 'win32') {
      spawnSync('taskkill', ['/pid', String(processInfo.child.pid), '/T', '/F'], { stdio: 'ignore' });
      continue;
    }

    processInfo.child.kill('SIGTERM');
  }
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
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(redactSensitiveSmokeText(error instanceof Error ? error.stack || error.message : String(error)));
    process.exit(1);
  });
}
