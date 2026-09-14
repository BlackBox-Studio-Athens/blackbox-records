import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { validateCmsFreeTier, validateCmsResources } from '../../scripts/cms-resources';

const resources = JSON.parse(readFileSync(new URL('../../cms-resources.json', import.meta.url), 'utf8'));
describe('CMS resource isolation', () => {
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
