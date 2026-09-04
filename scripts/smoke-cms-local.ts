import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { createConnection } from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { chromium, type Browser, type Page } from 'playwright';

import { assertSveltiaBuildArtifacts } from '../apps/web/src/lib/admin/sveltia-build-validation';
import { CmsSmokeLifecycle } from './cms-smoke-lifecycle';
import { attachSmokePageDiagnostics, captureSmokePageScreenshot } from './smoke-browser';
import {
  createRunId,
  createSmokeEvidencePath,
  createSmokeScenarioArtifactDir,
  createSmokeSummaryPath,
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
  evidenceDir: string;
  headed: boolean;
  screenshots: SmokeScreenshotMode;
  timeoutMs: number;
};

type CmsReadOnlyState = {
  contentHash: string;
  gitHead: string;
  gitStatus: string;
};

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(repoRoot, 'apps', 'web');
const siteUrl = 'http://127.0.0.1:4322/blackbox-records/';
const runtimeUrl = 'https://unpkg.com/@sveltia/cms@0.205.2/dist/sveltia-cms.js';

export function parseCmsLocalSmokeArgs(args: string[]): CmsLocalSmokeOptions {
  const { values } = parseArgs({
    args: args.filter((arg) => arg !== '--'),
    options: {
      'evidence-dir': { type: 'string', default: path.join(repoRoot, '.codex-artifacts', 'smoke', 'local', 'cms') },
      headed: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
      screenshots: { type: 'string', default: 'on-failure' },
      'timeout-ms': { type: 'string', default: '90000' },
    },
  });
  if (values.help) {
    console.log(
      'Usage: pnpm smoke:cms-local -- [--timeout-ms <ms>] [--evidence-dir <dir>] [--screenshots on-failure|always|never] [--headed]',
    );
    process.exit(0);
  }
  return {
    evidenceDir: parseRequiredValue('--evidence-dir', values['evidence-dir']),
    headed: values.headed,
    screenshots: parseScreenshotMode(values.screenshots),
    timeoutMs: parsePositiveInteger(values['timeout-ms'], '--timeout-ms'),
  };
}

export function checkCmsNativeStartup(input: {
  bodyText: string;
  hasLocalRepositoryButton: boolean;
  scriptUrls: string[];
}): string[] {
  const issues: string[] = [];
  if (!input.hasLocalRepositoryButton) issues.push('Sveltia did not reach native local repository selection.');
  if (/configuration errors?|invalid configuration|failed to load.*config/i.test(input.bodyText)) {
    issues.push('Sveltia rejected the generated configuration.');
  }
  if (!input.scriptUrls.includes(runtimeUrl)) issues.push('The pinned Sveltia runtime did not load.');
  return issues;
}

export function checkCmsReadOnlyInvariants(input: {
  after: CmsReadOnlyState;
  before: CmsReadOnlyState;
  externalMutationRequests: string[];
  publishClickCount: number;
}): string[] {
  const issues: string[] = [];
  if (input.before.contentHash !== input.after.contentHash)
    issues.push('CMS content or media changed during the read-only smoke.');
  if (input.before.gitHead !== input.after.gitHead) issues.push('Git HEAD changed during the read-only smoke.');
  if (input.before.gitStatus !== input.after.gitStatus) issues.push('Git status changed during the read-only smoke.');
  if (input.publishClickCount !== 0) issues.push('The read-only smoke selected Save or Publish.');
  if (input.externalMutationRequests.length)
    issues.push('The read-only smoke sent mutation requests: ' + input.externalMutationRequests.join(', ') + '.');
  return issues;
}

export function captureCmsReadOnlyState(): CmsReadOnlyState {
  const hash = createHash('sha256');
  for (const directory of [path.join(webRoot, 'src', 'content'), path.join(webRoot, 'public', 'assets')]) {
    const files = readdirSync(directory, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(entry.parentPath, entry.name))
      .sort();
    for (const file of files) {
      hash.update(path.relative(repoRoot, file).replaceAll('\\', '/'));
      hash.update('\0');
      hash.update(readFileSync(file));
      hash.update('\0');
    }
  }
  const git = (args: string[]) => {
    const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw new Error('Could not capture Git state for CMS smoke.');
    return result.stdout;
  };
  return {
    contentHash: hash.digest('hex'),
    gitHead: git(['rev-parse', 'HEAD']),
    gitStatus: git(['status', '--porcelain', '--untracked-files=all']),
  };
}

async function isCmsPortListening(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port: 4322 });
    const finish = (listening: boolean) => {
      socket.destroy();
      resolve(listening);
    };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(750, () => finish(false));
  });
}

export async function runCmsLocalSmoke(options: CmsLocalSmokeOptions) {
  const runId = createRunId();
  const runArtifactDir = path.join(options.evidenceDir, runId);
  const scenarioDir = createSmokeScenarioArtifactDir(runArtifactDir, 'editor-read-only');
  const lifecycle = new CmsSmokeLifecycle();
  const before = captureCmsReadOnlyState();
  const issues: string[] = [];
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const externalMutationRequests: string[] = [];
  let browser: Browser | undefined;
  let page: Page | undefined;
  let publishClickCount = 0;
  let screenshotPath: string | null = null;
  let snapshot: Parameters<typeof checkCmsNativeStartup>[0] | null = null;
  let diagnostics: ReturnType<typeof attachSmokePageDiagnostics> | undefined;

  mkdirSync(scenarioDir, { recursive: true });
  lifecycle.installProcessHandlers();
  try {
    if (await isCmsPortListening())
      throw new Error('CMS port 4322 is occupied. Stop its owner before running the smoke.');
    lifecycle.startProcess({
      command: process.execPath,
      args: [path.join(webRoot, 'scripts', 'start-cms-dev.mjs')],
      cwd: webRoot,
      env: { ...process.env, ASTRO_BASE_PATH: '/blackbox-records/', ASTRO_SITE_URL: 'http://127.0.0.1:4322' },
      name: 'astro-dev',
    });
    const deadline = Date.now() + options.timeoutMs;
    while (true) {
      lifecycle.assertHealthy();
      const response = await fetch(siteUrl + 'admin/config.yml', { signal: AbortSignal.timeout(2000) }).catch(
        () => null,
      );
      if (response?.ok) break;
      if (Date.now() >= deadline) throw new Error('Timed out waiting for local CMS configuration.');
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    browser = await lifecycle.race(chromium.launch({ headless: !options.headed, timeout: options.timeoutMs }));
    lifecycle.registerCleanup('Chromium browser', () => browser?.close());
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 900 } });
    lifecycle.registerCleanup('Playwright context', () => context.close());
    await context.route('**/*', async (route) => {
      const request = route.request();
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        const url = new URL(request.url());
        externalMutationRequests.push(request.method() + ' ' + url.origin + url.pathname);
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await context.addInitScript(() => {
      window.__BLACKBOX_CMS_SMOKE_PUBLISH_CLICKS__ = 0;
      document.addEventListener(
        'click',
        (event) => {
          const button = event.target instanceof Element ? event.target.closest('button, [role="button"]') : null;
          if (/^(save|publish)\b/i.test(button?.textContent?.trim() ?? '')) {
            window.__BLACKBOX_CMS_SMOKE_PUBLISH_CLICKS__ += 1;
            event.preventDefault();
            event.stopImmediatePropagation();
          }
        },
        true,
      );
    });
    page = await context.newPage();
    page.setDefaultTimeout(options.timeoutMs);
    diagnostics = attachSmokePageDiagnostics(page);
    lifecycle.registerCleanup('Page diagnostics', () => diagnostics?.dispose());
    const indexResponse = await lifecycle.race(
      page.goto(siteUrl + 'admin/index.html', { waitUntil: 'domcontentloaded' }),
    );
    if (!indexResponse?.ok()) throw new Error('Local admin document did not load successfully.');
    const readAsset = async (asset: string) => {
      const response = await context.request.get(siteUrl + asset, { timeout: options.timeoutMs });
      if (!response.ok()) throw new Error('Local CMS asset failed: ' + asset);
      return response.text();
    };
    const [configYaml, bootstrapJs] = await Promise.all([readAsset('admin/config.yml'), readAsset('admin/init.js')]);
    assertSveltiaBuildArtifacts({
      configYaml,
      bootstrapJs,
      indexHtml: await indexResponse.text(),
      expectedMode: 'local',
    });
    await Promise.all(['admin/admin.css', 'admin/preview.css', 'favicon.svg'].map(readAsset));
    await lifecycle.race(
      page.waitForFunction(
        () =>
          [...document.querySelectorAll('button')].some(
            (button) => button.textContent?.trim() === 'Work with Local Repository',
          ) || /configuration errors?|invalid configuration/i.test(document.body.innerText),
        undefined,
        { timeout: options.timeoutMs },
      ),
    );
    snapshot = {
      bodyText: (await page.locator('body').innerText()).slice(0, 4000),
      hasLocalRepositoryButton: await page
        .getByRole('button', { name: 'Work with Local Repository', exact: true })
        .isVisible(),
      scriptUrls: await page
        .locator('script[src]')
        .evaluateAll((scripts) => scripts.map((script) => (script as HTMLScriptElement).src)),
    };
    issues.push(...checkCmsNativeStartup(snapshot));
    lifecycle.assertHealthy();
  } catch (error) {
    issues.push(redactSensitiveSmokeText(error instanceof Error ? error.message : String(error)));
  } finally {
    consoleErrors.push(...(diagnostics?.consoleErrors ?? []));
    pageErrors.push(...(diagnostics?.pageErrors ?? []));
    if (page && !page.isClosed()) {
      publishClickCount = await page.evaluate(() => window.__BLACKBOX_CMS_SMOKE_PUBLISH_CLICKS__ ?? 0).catch(() => 0);
      if (
        options.screenshots === 'always' ||
        (options.screenshots === 'on-failure' && (issues.length || consoleErrors.length || pageErrors.length))
      ) {
        screenshotPath = path.join(scenarioDir, issues.length ? 'failure.png' : 'final.png');
        await captureSmokePageScreenshot(page, screenshotPath).catch(() => {
          issues.push('Could not capture the CMS smoke screenshot.');
        });
      }
    }
    await lifecycle.shutdown().catch((error: unknown) => {
      issues.push(redactSensitiveSmokeText(String(error)));
    });
  }

  const after = captureCmsReadOnlyState();
  const readOnlyIssues = checkCmsReadOnlyInvariants({ after, before, externalMutationRequests, publishClickCount });
  const shutdown = {
    browserConnected: browser?.isConnected() ?? false,
    listeningPorts: (await isCmsPortListening()) ? [4322] : [],
    runningPids: lifecycle.getRunningPids(),
  };
  const stoppedProcesses =
    !shutdown.browserConnected &&
    !shutdown.runningPids.length &&
    (!lifecycle.processes.length || !shutdown.listeningPorts.length);
  if (!stoppedProcesses) issues.push('Expected Astro and browser processes to stop before evidence was written.');
  const status =
    issues.length || readOnlyIssues.length || consoleErrors.length || pageErrors.length ? 'failed' : 'passed';
  const evidence = {
    checks: [{ issues, screenshotPath, snapshot, status, url: siteUrl + 'admin/index.html' }],
    consoleErrors,
    pageErrors,
    environment: 'local',
    generatedAt: new Date().toISOString(),
    processOutput: Object.fromEntries(lifecycle.processes.map((managed) => [managed.name, managed.output])),
    readOnly: { after, before, externalMutationRequests, issues: readOnlyIssues, publishClickCount },
    siteUrl,
    shutdown,
    status,
    stoppedProcesses,
    suite: 'cms-local',
  };
  writeJsonFile(createSmokeEvidencePath(scenarioDir), evidence);
  writeJsonFile(createSmokeSummaryPath(runArtifactDir), {
    generatedAt: evidence.generatedAt,
    runId,
    status,
    suite: evidence.suite,
  });
  return evidence;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCmsLocalSmoke(parseCmsLocalSmokeArgs(process.argv.slice(2)))
    .then((evidence) => {
      console.log('CMS local smoke: ' + evidence.status.toUpperCase());
      for (const issue of [
        ...evidence.checks.flatMap((check) => check.issues),
        ...evidence.readOnly.issues,
        ...evidence.consoleErrors,
        ...evidence.pageErrors,
      ])
        console.error(issue);
      if (evidence.status === 'failed') process.exitCode = 1;
    })
    .catch((error: unknown) => {
      console.error(redactSensitiveSmokeText(String(error)));
      process.exitCode = 1;
    });
}
