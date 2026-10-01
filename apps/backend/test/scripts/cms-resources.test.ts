import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  publicWorkerName,
  validateCmsFreeTier,
  validateCmsResources,
  validateLocalDurableObjectPaths,
} from '../../scripts/cms-resources';

const resources = JSON.parse(readFileSync(new URL('../../cms-resources.json', import.meta.url), 'utf8'));
describe('CMS resource isolation', () => {
  it('shares UAT Staff and Preview login while keeping browser origins and PRD authorization separate', () => {
    expect(resources.uat.preview_access_policy_aud).toBe(resources.uat.access_policy_aud);
    expect(resources.uat.preview_hostname).not.toBe(resources.uat.hostname);
    expect(resources.uat.access_policy_aud).not.toBe(resources.prd.access_policy_aud);
    expect(resources.uat.access_policy_aud).not.toBe(resources.prd.preview_access_policy_aud);
  });

  it('rejects KV introduced by source configuration or adapter output, including environment and unsafe bindings', () => {
    expect(() => validateCmsFreeTier({ kv_namespaces: [], env: { uat: {} } })).not.toThrow();
    for (const config of [
      { kv_namespaces: [{ binding: 'SESSION' }] },
      { env: { uat: { kv_namespaces: [{ binding: 'CACHE' }] } } },
      { unsafe: { bindings: [{ type: 'kv_namespace' }] } },
    ]) {
      expect(() => validateCmsFreeTier(config)).toThrow('CMS KV bindings are forbidden');
    }
  });

  it('accepts the configured targets and rejects database, bucket, and hostname reuse', () => {
    expect(() => validateCmsResources(resources, [])).not.toThrow();
    for (const field of ['database_id', 'database_name', 'bucket_name', 'hostname']) {
      const duplicate = structuredClone(resources);
      duplicate.prd[field] = duplicate.uat[field];
      expect(() => validateCmsResources(duplicate, [])).toThrow();
    }
    expect(() => validateCmsResources(resources, [resources.uat])).toThrow();
    expect(() => validateCmsResources({ ...resources, prd: undefined }, [])).toThrow();
  });
});

describe('Local Durable Object storage paths', () => {
  const durableObjects = (...classNames: string[]) => ({
    bindings: classNames.map((class_name) => ({ class_name })),
  });
  // 'C:\' plus padding, so each test controls the exact persistence root length.
  const persistRoot = (length: number) => `C:\\${'a'.repeat(length - 3)}`;

  it('refuses Windows storage paths that reach 256 characters and leaves other platforms alone', () => {
    // Below the root: \v3\do\blackbox-local-mock-CommerceRuntime\<64 hex>.sqlite-wal is 118 characters.
    const worker = { name: 'blackbox-local-mock', durable_objects: durableObjects('CommerceRuntime') };

    expect(() => validateLocalDurableObjectPaths(worker, persistRoot(137), 'win32')).not.toThrow();
    expect(() => validateLocalDurableObjectPaths(worker, persistRoot(138), 'win32')).toThrow(
      'CommerceRuntime storage needs a 256-character path',
    );
    expect(() => validateLocalDurableObjectPaths(worker, persistRoot(400), 'linux')).not.toThrow();
  });

  it('fits every Local Worker in a Windows checkout of up to 104 characters, such as a Claude Code worktree', () => {
    const { config } = ts.parseConfigFileTextToJson(
      'wrangler.jsonc',
      readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8'),
    );
    const persistTo = `${persistRoot(104)}\\apps\\backend\\.wrangler\\state`;

    for (const worker of [
      { name: config.name, durable_objects: durableObjects('CommerceRuntime') },
      { name: config.env.mock.name, durable_objects: durableObjects('CommerceRuntime', 'CmsRuntime') },
      { name: config.env['mock-api'].name, durable_objects: durableObjects('CommerceRuntime', 'CmsRuntime') },
      { name: publicWorkerName('local'), durable_objects: durableObjects('PublicSiteRuntime') },
    ]) {
      expect(() => validateLocalDurableObjectPaths(worker, persistTo, 'win32')).not.toThrow();
    }
    expect(() =>
      validateLocalDurableObjectPaths(
        { name: publicWorkerName('local'), durable_objects: durableObjects('PublicSiteRuntime') },
        `${persistRoot(105)}\\apps\\backend\\.wrangler\\state`,
        'win32',
      ),
    ).toThrow();
  });
});
