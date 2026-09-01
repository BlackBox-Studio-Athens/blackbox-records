import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(fileURLToPath(new URL('../.github/workflows/pages.yml', import.meta.url)), 'utf8');
const deployPrd = workflow.slice(workflow.indexOf('  deploy-prd:'), workflow.indexOf('  deploy-staff:'));
const deployStaff = workflow.slice(workflow.indexOf('  deploy-staff:'));

describe('Pages workflow contract', () => {
  it('keeps public and staff artifacts and deploy targets separate', () => {
    expect(workflow).toContain('- staff');
    expect(workflow).toContain("inputs.target == 'staff'");
    expect(deployPrd).toContain("inputs.target == 'all' || inputs.target == 'prd'");
    expect(deployPrd).not.toContain("inputs.target == 'staff'");
    expect(deployPrd).toContain('name: prd-public-static-site-${{ inputs.artifact_commit_sha || github.sha }}');
    expect(deployPrd).toContain('path: apps/web/dist');
    expect(deployPrd).toContain('--project-name=blackbox-records-web');
    expect(deployPrd).not.toContain('prd-staff-static-site-');
    expect(deployPrd).not.toContain('apps/staff/dist');
    expect(deployPrd).not.toContain('--project-name=blackbox-records-staff');
    expect(deployStaff).toContain("inputs.target == 'all' || inputs.target == 'staff'");
    expect(deployStaff).toContain('name: prd-staff-static-site-${{ inputs.artifact_commit_sha || github.sha }}');
    expect(deployStaff).toContain('path: apps/staff/dist');
    expect(deployStaff).toContain('--project-name=blackbox-records-staff');
    expect(deployStaff).not.toContain('prd-public-static-site-');
    expect(deployStaff).not.toContain('apps/web/dist');
    expect(deployStaff).not.toContain('--project-name=blackbox-records-web');
    expect(workflow).not.toContain('generate:api');
  });
});
