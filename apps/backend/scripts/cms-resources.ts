import { join } from 'node:path';

type CmsResource = { database_name: string; database_id: string; bucket_name: string; hostname?: string };

type LocalWorkerConfig = { name: string; durable_objects?: { bindings: { class_name: string }[] } };

// Local Worker names stay short: they name Durable Object storage directories (see below).
export function publicWorkerName(environment: 'local' | 'uat' | 'prd') {
  return environment === 'local' ? 'blackbox-public-local' : `blackbox-records-public-${environment}`;
}

// workerd on Windows cannot open SQLite files at 256 or more characters (seen with workerd 1.20260925.1). A Local
// Durable Object stored that deep fails every request with an opaque "internal error", so refuse to start instead.
export function validateLocalDurableObjectPaths(
  config: LocalWorkerConfig,
  persistTo: string,
  platform = process.platform,
) {
  if (platform !== 'win32') return;
  for (const { class_name } of config.durable_objects?.bindings ?? []) {
    const walPath = join(persistTo, 'v3', 'do', `${config.name}-${class_name}`, `${'0'.repeat(64)}.sqlite-wal`);
    if (walPath.length > 255) {
      throw new Error(
        `Local ${class_name} storage needs a ${walPath.length}-character path, but workerd on Windows cannot open SQLite files past 255 characters. Use a checkout path at least ${walPath.length - 255} characters shorter.`,
      );
    }
  }
}

type CmsWorkerConfig = {
  kv_namespaces?: unknown[];
  unsafe?: { bindings?: { type: string }[] };
  env?: Record<string, CmsWorkerConfig>;
};

export function validateCmsFreeTier(config: CmsWorkerConfig) {
  if (config.kv_namespaces?.length || config.unsafe?.bindings?.some((binding) => binding.type === 'kv_namespace')) {
    throw new Error(
      'CMS KV bindings are forbidden: keep Astro sessions disabled. Any exception requires a documented Free-tier budget and an intentional policy/test update.',
    );
  }
  for (const environment of Object.values(config.env ?? {})) validateCmsFreeTier(environment);
}

export function validateCmsResources(
  resources: Partial<Record<'local' | 'uat' | 'prd', CmsResource>>,
  commerceDatabases: { database_name: string; database_id?: string }[],
) {
  const names = new Set(commerceDatabases.map((db) => db.database_name));
  const ids = new Set(commerceDatabases.map((db) => db.database_id).filter(Boolean));
  const buckets = new Set();
  for (const target of ['local', 'uat', 'prd'] as const) {
    const cms = resources[target];
    if (!cms?.database_id || !cms.database_name || !cms.bucket_name) {
      throw new Error(`CMS resources must be explicitly configured for ${target}`);
    }
    if (names.has(cms.database_name) || ids.has(cms.database_id) || buckets.has(cms.bucket_name)) {
      throw new Error('CMS resources must be isolated from commerce and other environments');
    }
    names.add(cms.database_name);
    ids.add(cms.database_id);
    buckets.add(cms.bucket_name);
  }
  if (!resources.uat?.hostname || !resources.prd?.hostname || resources.uat.hostname === resources.prd.hostname) {
    throw new Error('Hosted staff hostnames must be separate');
  }
}
