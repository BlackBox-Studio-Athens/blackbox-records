import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CmsSmokeLifecycle,
  formatCmsSmokeProcessFailure,
  type CmsSmokeProcess,
} from '../../../../scripts/cms-smoke-lifecycle';
import {
  checkCmsNativeStartup,
  checkCmsReadOnlyInvariants,
  parseCmsLocalSmokeArgs,
} from '../../../../scripts/smoke-cms-local';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('CMS smoke lifecycle', () => {
  it('labels spawn failures with the component and exits the race immediately', async () => {
    const lifecycle = new CmsSmokeLifecycle();
    lifecycle.startProcess({
      command: `missing-cms-smoke-command-${Date.now()}`,
      cwd: repositoryRoot,
      env: process.env,
      name: 'astro-dev',
    });

    await expect(lifecycle.race(new Promise((resolve) => setTimeout(resolve, 5_000)))).rejects.toThrow(
      /astro-dev .*exited|astro-dev failed to start/i,
    );
    await lifecycle.shutdown();
  });

  it('fails when a managed process exits unexpectedly after startup', async () => {
    const lifecycle = new CmsSmokeLifecycle();
    lifecycle.startProcess({
      args: ['-e', 'setTimeout(() => process.exit(7), 25)'],
      command: process.execPath,
      cwd: repositoryRoot,
      env: process.env,
      name: 'astro-dev',
    });

    await expect(lifecycle.race(new Promise((resolve) => setTimeout(resolve, 5_000)))).rejects.toThrow(
      'astro-dev exited with code 7',
    );
    await lifecycle.shutdown();
  });

  it('closes browser resources in reverse order and terminates every child', async () => {
    const lifecycle = new CmsSmokeLifecycle();
    const closed: string[] = [];
    lifecycle.startProcess({
      args: ['-e', 'setInterval(() => {}, 1000)'],
      command: process.execPath,
      cwd: repositoryRoot,
      env: process.env,
      name: 'astro-dev',
    });
    lifecycle.registerCleanup('browser', () => {
      closed.push('browser');
    });
    lifecycle.registerCleanup('context', () => {
      closed.push('context');
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    await lifecycle.shutdown();

    expect(closed).toEqual(['context', 'browser']);
    expect(lifecycle.areProcessesStopped()).toBe(true);
  });

  it('formats redacted process output without dropping the component name', () => {
    const processInfo = {
      child: {} as CmsSmokeProcess['child'],
      knownPids: new Set<number>(),
      name: 'astro-dev',
      output: ['startup failed'],
      treeCaptureTimer: null,
    } satisfies CmsSmokeProcess;

    expect(formatCmsSmokeProcessFailure(processInfo, 'exited with code 1').message).toBe(
      'astro-dev exited with code 1.\nstartup failed',
    );
  });

  it('installs cleanup coverage for signals and parent exit', () => {
    const source = readFileSync(path.join(repositoryRoot, 'scripts', 'cms-smoke-lifecycle.ts'), 'utf8');
    expect(source).toContain("process.once('SIGINT'");
    expect(source).toContain("process.once('SIGTERM'");
    expect(source).toContain("process.once('SIGHUP'");
    expect(source).toContain("process.once('exit'");
  });
});

describe('local CMS smoke contract', () => {
  it('parses supported options and keeps the CMS port fixed', () => {
    expect(parseCmsLocalSmokeArgs(['--', '--timeout-ms', '45000', '--screenshots=never', '--headed'])).toMatchObject({
      screenshots: 'never',
      timeoutMs: 45_000,
      headed: true,
    });
    expect(() => parseCmsLocalSmokeArgs(['--cms-port', '4333'])).toThrow();
    expect(() => parseCmsLocalSmokeArgs(['--proxy-port', '8093'])).toThrow();
    expect(() => parseCmsLocalSmokeArgs(['--timeout-ms', '0'])).toThrow('--timeout-ms must be a positive integer');
  });

  it('fails read-only evidence for content, commit, status, publish, or mutation changes', () => {
    expect(
      checkCmsReadOnlyInvariants({
        after: { contentHash: 'after', gitHead: 'after', gitStatus: 'after' },
        before: { contentHash: 'before', gitHead: 'before', gitStatus: 'before' },
        externalMutationRequests: ['POST https://provider.example/write'],
        publishClickCount: 1,
      }),
    ).toEqual([
      'CMS content or media changed during the read-only smoke.',
      'Git HEAD changed during the read-only smoke.',
      'Git status changed during the read-only smoke.',
      'The read-only smoke selected Save or Publish.',
      'The read-only smoke sent mutation requests: POST https://provider.example/write.',
    ]);
    const state = { contentHash: 'same', gitHead: 'same', gitStatus: ' M existing-user-change' };
    expect(
      checkCmsReadOnlyInvariants({
        before: state,
        after: { ...state },
        externalMutationRequests: [],
        publishClickCount: 0,
      }),
    ).toEqual([]);
  });

  it('requires the native repository picker, not only a loaded runtime', () => {
    const scriptUrls = ['https://unpkg.com/@sveltia/cms@0.205.2/dist/sveltia-cms.js'];
    expect(
      checkCmsNativeStartup({
        bodyText: 'Work with Local Repository',
        hasLocalRepositoryButton: true,
        scriptUrls,
      }),
    ).toEqual([]);
    expect(
      checkCmsNativeStartup({
        bodyText: 'Configuration Errors: Invalid field name',
        hasLocalRepositoryButton: false,
        scriptUrls,
      }),
    ).toEqual([
      'Sveltia did not reach native local repository selection.',
      'Sveltia rejected the generated configuration.',
    ]);
    expect(
      checkCmsNativeStartup({
        bodyText: 'Configuration Errors',
        hasLocalRepositoryButton: true,
        scriptUrls,
      }),
    ).toContain('Sveltia rejected the generated configuration.');
    expect(
      checkCmsNativeStartup({
        bodyText: 'Loading the editor',
        hasLocalRepositoryButton: false,
        scriptUrls: [],
      }),
    ).toHaveLength(2);
  });

  it('fails the real launcher when port 4322 is occupied, without choosing another port', async () => {
    const occupied = createServer();
    await new Promise<void>((resolve, reject) => {
      occupied.once('error', reject);
      occupied.listen(4322, '127.0.0.1', resolve);
    });
    const lifecycle = new CmsSmokeLifecycle();
    try {
      lifecycle.startProcess({
        command: process.execPath,
        args: [path.join(repositoryRoot, 'apps/web/scripts/start-cms-dev.mjs')],
        cwd: path.join(repositoryRoot, 'apps/web'),
        env: process.env,
        name: 'astro-dev',
      });
      await expect(lifecycle.race(new Promise((resolve) => setTimeout(resolve, 30000)))).rejects.toThrow(
        /Port 4322 is already in use/,
      );
    } finally {
      await lifecycle.shutdown();
      await new Promise<void>((resolve) => occupied.close(() => resolve()));
    }
  }, 40000);

  it('uses the native strict-port launcher without a repository-write proxy or fake filesystem', () => {
    const source = readFileSync(path.join(repositoryRoot, 'scripts', 'smoke-cms-local.ts'), 'utf8');
    const launcher = readFileSync(path.join(repositoryRoot, 'apps/web/scripts/start-cms-dev.mjs'), 'utf8');
    expect(source).toContain("'start-cms-dev.mjs'");
    expect(source).toContain("'--porcelain'");
    expect(source).not.toMatch(/decap-server|showDirectoryPicker\s*=|proxyPort/);
    expect(launcher).toContain('strictPort: true');
    expect(launcher).toContain('port: 4322');
    expect(launcher).not.toContain('spawn');
  });
});
