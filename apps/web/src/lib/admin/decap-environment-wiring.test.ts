import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('../../../../../', import.meta.url));
const webRoot = resolve(repositoryRoot, 'apps', 'web');

function readRepositoryFile(path: string): string {
  return readFileSync(resolve(repositoryRoot, path), 'utf8');
}

describe('Decap environment wiring', () => {
  it.each([
    ['apps/web/scripts/start-cms-dev.mjs', readRepositoryFile('apps/web/scripts/start-cms-dev.mjs')],
    ['scripts/smoke-cms-local.ts', readRepositoryFile('scripts/smoke-cms-local.ts')],
  ])('%s forces foreground local mode and strips hosted-only settings', (_path, source) => {
    expect(source).toContain("ASTRO_DEV_BACKGROUND: '0'");
    expect(source).toContain("DECAP_BACKEND_MODE: 'local'");
    expect(source).toContain("'DECAP_REPOSITORY'");
    expect(source).toContain("'DECAPBRIDGE_AUTH_ENDPOINT'");
    expect(source).toContain('delete ');
  });

  it('sets UAT and full PRD builds to hosted mode with safe preflight', () => {
    const workflow = readRepositoryFile('.github/workflows/pages.yml');

    expect(workflow.match(/DECAP_BACKEND_MODE: hosted/g)).toHaveLength(2);
    expect(workflow.match(/run: pnpm cms:hosted:preflight/g)).toHaveLength(2);
    expect(workflow).toContain('name: Build hosted UAT static frontend');
    expect(workflow).toContain('name: Build hosted PRD static frontend');
  });

  it('keeps secret-free artifact and holding builds disabled', () => {
    expect(readRepositoryFile('.github/workflows/prd-holding-page.yml')).toMatch(
      /name: Build PRD-shaped static frontend[\s\S]*?DECAP_BACKEND_MODE: disabled/,
    );
    expect(readRepositoryFile('.github/workflows/catalog-promotion.yml')).toMatch(
      /name: Run repository gates[\s\S]*?DECAP_BACKEND_MODE: disabled/,
    );
  });

  it('keeps UAT static smoke public and secret-free', () => {
    const workflow = readRepositoryFile('.github/workflows/uat-static-smoke.yml');

    expect(workflow).toContain("workflows: ['Deploy UAT and PRD static sites']");
    expect(workflow).toContain('ref: ${{ github.event.workflow_run.head_sha || github.sha }}');
    expect(workflow).toContain('--site-url "${UAT_STATIC_SITE_URL}"');
    expect(workflow).toContain("UAT_STATIC_SMOKE_SCENARIO: ${{ inputs.scenario || 'all' }}");
    expect(workflow).not.toContain('${{ secrets.');
    expect(workflow).not.toMatch(/DECAP(?:BRIDGE)?_[A-Z_]+/);
  });

  it('wires build validation and hosted preflight through package scripts', () => {
    const webPackage = JSON.parse(readFileSync(resolve(webRoot, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>;
    };
    const rootPackage = JSON.parse(readRepositoryFile('package.json')) as { scripts: Record<string, string> };

    expect(webPackage.scripts['cms:hosted:preflight']).toBe('tsx scripts/check-decap-hosted-env.ts');
    expect(webPackage.scripts['cms:build-mode:check']).toBe('tsx scripts/check-decap-build-mode.ts');
    expect(webPackage.scripts.build).toContain('pnpm cms:build-mode:check');
    expect(rootPackage.scripts['cms:hosted:preflight']).toBe('pnpm --filter @blackbox/web cms:hosted:preflight');
  });

  it('documents explicit modes without local hosted-auth claims', () => {
    const readme = readRepositoryFile('README.md');

    expect(readme).toContain('`DECAP_BACKEND_MODE`');
    expect(readme).toContain('Ordinary secret-free production builds default to `disabled`');
    expect(readme).toContain('Local CMS commands force `local` mode');
    expect(readme).toMatch(/^\|\s*`local`\s*\|\s*`pnpm cms:dev` and Local CMS Smoke\s*\|/m);
    expect(readme).toMatch(/^\|\s*`hosted`\s*\|\s*GitHub Pages UAT and the full Cloudflare Pages PRD build\s*\|/m);
    expect(readme).toMatch(/^\|\s*`disabled`\s*\|\s*Ordinary secret-free builds, PRD Holding Page/m);
    expect(readme).toContain('Do not enable Decap editorial workflow in this iteration.');
    expect(readme).not.toContain('unless you explicitly provide real DecapBridge values in your local environment');
    expect(readme).not.toContain('generated config stays on the local `proxy` backend');
  });

  it('keeps the committed environment example non-secret and preflight-explicit', () => {
    const example = readRepositoryFile('apps/web/.env.example');
    expect(example).toContain('DECAP_BACKEND_MODE=disabled');
    expect(example).toContain('DECAP_REPOSITORY=BlackBox-Studio-Athens/blackbox-records');
    expect(example).toContain('DECAPBRIDGE_AUTH_ENDPOINT=/sites/__SET_DECAPBRIDGE_SITE_ID__/pkce');
    expect(example).toContain('DECAPBRIDGE_AUTH_TOKEN_ENDPOINT=/sites/__SET_DECAPBRIDGE_SITE_ID__/token');
    expect(example).toContain('pnpm cms:hosted:preflight');
    expect(example).not.toMatch(/(?:ghp_|github_pat_|sk_live_|whsec_)[A-Za-z0-9_]+/);
  });
});
