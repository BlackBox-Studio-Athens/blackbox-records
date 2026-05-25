import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const rootDir = path.resolve(__dirname, '..', '..', '..', '..');

function readWorkflow(name: string): string {
  return readFileSync(path.join(rootDir, '.github', 'workflows', name), 'utf8');
}

describe('catalog promotion workflows', () => {
  it('keeps artifact regeneration scoped to CMS/catalog inputs and generated artifact outputs', () => {
    const workflow = readWorkflow('catalog-artifacts.yml');

    expect(workflow).toContain('apps/web/src/content/distro/**');
    expect(workflow).toContain('apps/web/src/content/releases/**');
    expect(workflow).toContain('scripts/stripe-catalog-contract.ts');
    expect(workflow).toContain('scripts/generate-stripe-uat-catalog-artifacts.ts');
    expect(workflow).toContain(
      'apps/backend/src/application/commerce/catalog-sync/(catalog-product-projections|desired-catalog-state)\\.ts',
    );
    expect(workflow).toContain(
      'apps/backend/prisma/seeds/(sandbox-uat-commerce-state|production-commerce-readiness)\\.sql',
    );
  });

  it('prevents artifact commit loops and uses the GitHub Actions bot identity', () => {
    const workflow = readWorkflow('catalog-artifacts.yml');

    expect(workflow).toContain(
      "!contains(github.event.head_commit.message, 'chore(catalog): regenerate promotion artifacts')",
    );
    expect(workflow).toContain('git config user.name "github-actions[bot]"');
    expect(workflow).toContain('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"');
    expect(workflow).toContain('gh workflow run catalog-promotion.yml');
  });

  it('keeps production promotion behind UAT success and CI promotion context', () => {
    const workflow = readWorkflow('catalog-promotion.yml');

    expect(workflow).toContain("inputs.target == 'all' && needs.promote-uat.result == 'success'");
    expect(workflow).toContain('pnpm test:unit');
    expect(workflow).toContain('pnpm check');
    expect(workflow).toContain('pnpm build');
    expect(workflow).toContain('pnpm runtime:config:verify --env production');
    expect(workflow).toContain('pnpm production:catalog-readiness:check -- --phase pre-apply');
    expect(workflow).toContain('pnpm production:catalog-readiness:check -- --phase post-apply');
    expect(workflow).toContain('pnpm stripe:catalog:verify --env production --apply --ci-promotion');
    expect(workflow).toContain('--artifact-commit-sha "${{ inputs.artifact_commit_sha }}"');
    expect(workflow).toContain('--promotion-run-id "${{ github.run_id }}"');
    expect(workflow).toContain('pnpm smoke:stripe-promotion -- --env production --scenario all');
    expect(workflow).toContain('actions/upload-artifact@v5.0.0');
  });
});
