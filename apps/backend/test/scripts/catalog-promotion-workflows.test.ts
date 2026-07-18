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
    expect(workflow).toContain('apps/backend/prisma/seeds/(uat-commerce-state|prd-commerce-readiness)\\.sql');
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

  it('keeps PRD promotion behind UAT success, PRD-open gate, and CI promotion context', () => {
    const workflow = readWorkflow('catalog-promotion.yml');

    expect(workflow).toContain("inputs.target == 'all' && needs.promote-uat.result == 'success'");
    expect(workflow).toContain('- prd');
    expect(workflow).not.toContain('- production');
    expect(workflow).toContain('catalog-promotion-prd');
    expect(workflow).toContain('PRD_OPEN_GATE');
    expect(workflow).toContain('prd-not-configured.txt');
    expect(workflow).toContain('pnpm test:unit');
    expect(workflow).toContain('pnpm check');
    expect(workflow).toContain('pnpm build');
    expect(workflow).toContain('pnpm runtime:config:verify --env prd');
    expect(workflow).toContain('pnpm prd:catalog-readiness:check -- --phase pre-apply');
    expect(workflow).toContain('pnpm prd:catalog-readiness:check -- --phase post-apply');
    expect(workflow).toContain('pnpm stripe:catalog:verify --env prd --apply --ci-promotion');
    expect(workflow).toContain('--artifact-commit-sha "${{ inputs.artifact_commit_sha }}"');
    expect(workflow).toContain('CATALOG_MUTATION_SCOPE: ${{ github.run_id }}');
    expect(workflow).toContain('--promotion-run-id "$CATALOG_MUTATION_SCOPE"');
    expect(workflow).toContain('actions/upload-artifact@v5.0.0');
    expect(workflow).not.toContain('pnpm smoke:stripe-sandbox');
    expect(workflow).not.toContain('pnpm smoke:uat-static');
    expect(workflow).not.toContain('pnpm smoke:stripe-promotion');
    expect(workflow).not.toContain('.codex-artifacts/smoke/');
  });

  it('clears stale UAT catalog pointers when a provider reset is requested', () => {
    const workflow = readWorkflow('catalog-promotion.yml');
    const resetStep = workflow.slice(
      workflow.indexOf('- name: Reset UAT provider catalog and D1 pointers'),
      workflow.indexOf('- name: Plan UAT provider catalog'),
    );
    const resetIndex = workflow.indexOf('pnpm stripe:catalog:reset-uat --env uat --confirm');
    const clearSnapshotsIndex = workflow.indexOf('DELETE FROM StoreOfferSnapshot');
    const clearMappingsIndex = workflow.indexOf('DELETE FROM VariantStripeMapping');
    const applyIndex = workflow.indexOf('pnpm stripe:catalog:verify --env uat --apply');

    expect(resetIndex).toBeGreaterThan(-1);
    expect(resetStep).toContain('set -o pipefail');
    expect(clearSnapshotsIndex).toBeGreaterThan(resetIndex);
    expect(clearMappingsIndex).toBeGreaterThan(clearSnapshotsIndex);
    expect(applyIndex).toBeGreaterThan(clearMappingsIndex);
    expect(workflow).toContain(
      "CATALOG_MUTATION_SCOPE: ${{ inputs.reset_uat_catalog && format('{0}-{1}', github.run_id, github.run_attempt) || github.run_id }}",
    );
    expect(workflow).toContain(
      'pnpm stripe:catalog:verify --env uat --apply --promotion-run-id "$CATALOG_MUTATION_SCOPE"',
    );
    expect(workflow).not.toContain('DELETE FROM Stock WHERE');
    expect(workflow).not.toContain('DELETE FROM ItemAvailability WHERE');
  });

  it('fails promotion when a post-apply verification piped to evidence fails', () => {
    const workflow = readWorkflow('catalog-promotion.yml');
    const uatPlanStep = workflow.slice(
      workflow.indexOf('- name: Plan UAT provider catalog'),
      workflow.indexOf('- name: Apply UAT provider catalog'),
    );
    const uatApplyStep = workflow.slice(
      workflow.indexOf('- name: Apply UAT provider catalog'),
      workflow.indexOf('- name: Deploy UAT Worker'),
    );
    const prdPlanStep = workflow.slice(
      workflow.indexOf('- name: Plan PRD provider catalog'),
      workflow.indexOf('- name: Apply PRD provider catalog'),
    );
    const prdApplyStep = workflow.slice(
      workflow.indexOf('- name: Apply PRD provider catalog'),
      workflow.indexOf('- name: Deploy PRD Worker'),
    );

    expect(uatPlanStep).toContain('set -o pipefail');
    expect(uatPlanStep).toContain('--plan-apply');
    expect(uatApplyStep).toContain('set -o pipefail');
    expect(prdPlanStep).toContain('set -o pipefail');
    expect(prdPlanStep).toContain('--plan-apply');
    expect(prdApplyStep).toContain('set -o pipefail');
  });

  it('keeps catalog commits out of push deploys and dispatches static deployment only after hosted readiness', () => {
    const pages = readWorkflow('pages.yml');
    const promotion = readWorkflow('catalog-promotion.yml');
    const uatWorker = promotion.indexOf('- name: Deploy UAT Worker');
    const uatReadiness = promotion.indexOf('- name: Verify hosted UAT listing readiness');
    const uatStatic = promotion.indexOf('- name: Dispatch UAT static deployment');

    expect(pages).toContain("- 'apps/web/src/content/distro/**'");
    expect(pages).toContain("- 'apps/web/src/content/releases/**'");
    expect(pages).toContain("- 'apps/backend/src/application/commerce/catalog-sync/desired-catalog-state.ts'");
    expect(pages).toContain('artifact_commit_sha:');
    expect(pages).toContain('ref: ${{ inputs.artifact_commit_sha || github.sha }}');
    expect(pages).toContain("inputs.target == 'uat'");
    expect(pages).toContain("inputs.target == 'prd'");
    expect(uatReadiness).toBeGreaterThan(uatWorker);
    expect(uatStatic).toBeGreaterThan(uatReadiness);
    expect(promotion).toContain('pnpm store:listing-readiness:verify -- --env uat');
    expect(promotion).toContain('gh workflow run pages.yml');
    expect(promotion).toContain('-f artifact_commit_sha=${{ inputs.artifact_commit_sha }} -f target=uat');
  });

  it('defines a manual UAT static smoke workflow with the standard smoke inputs', () => {
    const workflow = readWorkflow('uat-static-smoke.yml');

    expect(workflow).toContain('workflow_dispatch');
    expect(workflow).toContain('site_url');
    expect(workflow).toContain('scenario');
    expect(workflow).toContain('timeout_ms');
    expect(workflow).toContain('evidence_dir');
    expect(workflow).toContain('screenshots');
    expect(workflow).toContain('headed');
    expect(workflow).toContain('pnpm smoke:uat-static --');
    expect(workflow).toContain('.codex-artifacts/smoke/uat/uat-static/**');
  });
});
