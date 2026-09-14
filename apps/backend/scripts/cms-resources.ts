type CmsResource = { database_name: string; database_id: string; bucket_name: string; hostname?: string };

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
