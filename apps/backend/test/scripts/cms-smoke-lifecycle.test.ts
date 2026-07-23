import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CmsSmokeLifecycle,
  formatCmsSmokeProcessFailure,
  type CmsSmokeProcess,
} from '../../../../scripts/cms-smoke-lifecycle';
import { checkCmsReadOnlyInvariants, parseCmsLocalSmokeArgs } from '../../../../scripts/smoke-cms-local';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

describe('CMS smoke lifecycle', () => {
  it('labels spawn failures with the component and exits the race immediately', async () => {
    const lifecycle = new CmsSmokeLifecycle();
    lifecycle.startProcess({
      command: `missing-cms-smoke-command-${Date.now()}`,
      cwd: repositoryRoot,
      env: process.env,
      name: 'decap-server',
    });

    await expect(lifecycle.race(new Promise((resolve) => setTimeout(resolve, 5_000)))).rejects.toThrow(
      /decap-server .*exited|decap-server failed to start/i,
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
      name: 'decap-server',
      output: ['startup failed'],
      treeCaptureTimer: null,
    } satisfies CmsSmokeProcess;

    expect(formatCmsSmokeProcessFailure(processInfo, 'exited with code 1').message).toBe(
      'decap-server exited with code 1.\nstartup failed',
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
  it('parses explicit smoke options', () => {
    expect(
      parseCmsLocalSmokeArgs([
        '--cms-port',
        '4333',
        '--proxy-port',
        '8093',
        '--timeout-ms',
        '45000',
        '--screenshots',
        'never',
      ]),
    ).toMatchObject({ cmsPort: 4333, proxyPort: 8093, screenshots: 'never', timeoutMs: 45_000 });
  });

  it('fails read-only evidence for content, commit, publish, or provider mutation changes', () => {
    expect(
      checkCmsReadOnlyInvariants({
        after: { contentHash: 'after', gitHead: 'after' },
        before: { contentHash: 'before', gitHead: 'before' },
        externalMutationRequests: ['POST https://provider.example/write'],
        publishClickCount: 1,
      }),
    ).toEqual([
      'CMS content files changed during the read-only smoke.',
      'Git HEAD changed during the read-only smoke.',
      'The read-only smoke selected Publish.',
      'The read-only smoke sent external mutation requests: POST https://provider.example/write.',
    ]);
  });

  it('covers the five representative editor and preview contracts', () => {
    const source = readFileSync(path.join(repositoryRoot, 'scripts', 'smoke-cms-local.ts'), 'utf8');
    for (const contract of [
      "collection: 'home'",
      "collection: 'artists'",
      "collection: 'releases'",
      "collection: 'distro'",
      "collection: 'news'",
      "entry: 'chronoboros'",
      "entry: 'caregivers'",
      "entry: 'barren-point'",
      "entry: 'lorem-ipsum'",
      'data-blackbox-preview-toggle',
      'data-blackbox-fixed-section-actions',
      'data-blackbox-cms-scope-panel',
    ]) {
      expect(source).toContain(contract);
    }
  });
});
