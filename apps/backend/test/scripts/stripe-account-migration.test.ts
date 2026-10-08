import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import type Stripe from 'stripe';
import { afterEach, describe, expect, it } from 'vitest';
import { StripeCatalogGatewayClient } from '../../src/infrastructure/stripe';
import { productEnvironmentProfileFromWorkerRuntimeTarget } from '../../src/platform/env';
import { CatalogReconciler } from '../../src/application/commerce/catalog-sync';
import {
  createD1CatalogReadSql,
  createD1CatalogRepositories,
  type D1CatalogRow,
} from '../../../../scripts/stripe-catalog-verify';
import {
  accountMigrationBatch,
  executeAccountMigration,
  formatAccountMigrationError,
  parseAccountMigrationArgs,
  parseAccountMigrationQueryRows,
  planAccountMigration,
  verifyAccountMigrationImage,
  type AccountMigrationJournal,
  type AccountMigrationManifest,
} from '../../scripts/migrate-stripe-account';

type Product = Stripe.Product;
type Price = Stripe.Price;
const image = `${productEnvironmentProfileFromWorkerRuntimeTarget('uat').publicBackendOrigin}/media/published/${'a'.repeat(64)}`;
const accountMap = {
  uat: ['acct_fixtureAFb7Ub', 'acct_fixturePfsVCp'],
  prd: ['acct_fixturedyR3DM', 'acct_fixtureGRpxub'],
} as const;
const databases: DatabaseSync[] = [];
afterEach(() => {
  for (const database of databases.splice(0)) database.close();
});

function provider(accountId: string, live: boolean) {
  const products: Product[] = [];
  const prices: Price[] = [];
  let productCreates = 0,
    priceCreates = 0;
  let crash: 'product' | 'price' | 'default' | null = null;
  const list = <T>(values: T[]) => ({
    async *[Symbol.asyncIterator]() {
      for (const value of values) yield structuredClone(value);
    },
  });
  const product = (id: string) => {
    const result = products.find((entry) => entry.id === id);
    if (!result) throw Object.assign(new Error('missing'), { statusCode: 404, code: 'resource_missing' });
    return result;
  };
  const price = (id: string) => {
    const result = prices.find((entry) => entry.id === id);
    if (!result) throw Object.assign(new Error('missing'), { statusCode: 404, code: 'resource_missing' });
    return result;
  };
  const api = {
    accounts: {
      retrieveCurrent: async () => ({ id: accountId }),
      retrieve: async (id: string) => ({ id }),
    },
    balance: { retrieve: async () => ({ livemode: live }) },
    products: {
      list: () => list(products),
      retrieve: async (id: string, params?: { expand?: string[] }) => {
        const result = structuredClone(product(id));
        if (params?.expand?.includes('default_price') && result.default_price)
          result.default_price = structuredClone(price(String(result.default_price)));
        return result;
      },
      create: async (input: Stripe.ProductCreateParams) => {
        productCreates++;
        const result = {
          ...input,
          id: input.id!,
          object: 'product',
          default_price: null,
          livemode: live,
          description: input.description ?? null,
          images: input.images ?? [],
          metadata: input.metadata ?? {},
          active: input.active ?? true,
        } as Product;
        products.push(result);
        if (crash === 'product') {
          crash = null;
          throw new Error('Connection lost after Product creation');
        }
        return structuredClone(result);
      },
      update: async (id: string, input: Stripe.ProductUpdateParams) => {
        Object.assign(product(id), input);
        if (crash === 'default') {
          crash = null;
          throw new Error('Connection lost after default selection');
        }
        return structuredClone(product(id));
      },
    },
    prices: {
      list: (params: Stripe.PriceListParams) =>
        list(
          prices.filter(
            (entry) =>
              (params.active === undefined || params.active === entry.active) &&
              (!params.product || entry.product === params.product) &&
              (!params.lookup_keys || params.lookup_keys.includes(entry.lookup_key!)),
          ),
        ),
      retrieve: async (id: string, params?: { expand?: string[] }) => {
        const result = structuredClone(price(id));
        if (params?.expand?.includes('product')) result.product = structuredClone(product(String(result.product)));
        return result;
      },
      create: async (input: Stripe.PriceCreateParams) => {
        priceCreates++;
        const custom = input.custom_unit_amount;
        const result = {
          ...input,
          id: `price_target_${priceCreates}`,
          object: 'price',
          type: 'one_time',
          unit_amount: input.unit_amount ?? null,
          livemode: live,
          active: input.active ?? true,
          custom_unit_amount: custom
            ? { minimum: custom.minimum ?? null, maximum: custom.maximum ?? null, preset: custom.preset ?? null }
            : null,
          lookup_key: input.lookup_key ?? null,
          metadata: input.metadata ?? {},
          product: input.product!,
        } as Price;
        prices.push(result);
        if (crash === 'price') {
          crash = null;
          throw new Error('Connection lost after Price creation');
        }
        return structuredClone(result);
      },
      update: async (id: string, input: Stripe.PriceUpdateParams) => {
        Object.assign(price(id), input);
        return structuredClone(price(id));
      },
    },
  };
  return {
    products,
    prices,
    api,
    gateway: new StripeCatalogGatewayClient(api as unknown as Stripe, live),
    counts: () => ({ products: productCreates, prices: priceCreates }),
    crashAfter: (stage: typeof crash) => {
      crash = stage;
    },
  };
}

function fixture(environment: 'uat' | 'prd' = 'uat') {
  const runtimeImage = `${productEnvironmentProfileFromWorkerRuntimeTarget(environment).publicBackendOrigin}${new URL(image).pathname}`;
  const db = new DatabaseSync(':memory:');
  const cmsDb = new DatabaseSync(':memory:');
  databases.push(db, cmsDb);
  cmsDb.exec(`CREATE TABLE ec_distro (id TEXT PRIMARY KEY, slug TEXT, status TEXT, data TEXT,
      live_revision_id TEXT, draft_revision_id TEXT, updated_at TEXT, version INTEGER);
    CREATE TABLE ec_releases (id TEXT PRIMARY KEY, slug TEXT, status TEXT, data TEXT,
      live_revision_id TEXT, draft_revision_id TEXT, updated_at TEXT, version INTEGER);
    INSERT INTO ec_distro VALUES ('unlinked-cms', 'cms-without-catalog', 'draft', '{"title":"Private draft"}', NULL, 'revision_kept', '2026-10-08', 1);
    CREATE TABLE publication (id TEXT PRIMARY KEY, snapshot TEXT);
    INSERT INTO publication VALUES ('live', 'accepted_snapshot_kept');
    CREATE TABLE options (name TEXT PRIMARY KEY, value TEXT NOT NULL, revision TEXT NOT NULL);
    INSERT INTO options VALUES ('system:scheduler:last_completed_at', '"2026-10-08T00:00:00.000Z"', 'heartbeat_before');
    INSERT INTO options VALUES ('seed:complete', 'true', 'seed_before');
    CREATE TABLE media (id TEXT PRIMARY KEY, url TEXT NOT NULL);
    INSERT INTO media VALUES ('artwork_kept', '/media/content/artwork_kept');
    CREATE TABLE _emdash_media_usage_cleanup (
      task_key TEXT PRIMARY KEY, lease_token TEXT, lease_expires_at TEXT, next_eligible_at TEXT,
      cursor_created_at TEXT, cursor_id TEXT, scan_before_at TEXT, consecutive_failures INTEGER DEFAULT 0,
      last_started_at TEXT, last_completed_at TEXT, last_candidate_count INTEGER DEFAULT 0,
      last_deleted_orphans INTEGER DEFAULT 0, last_deleted_stale INTEGER DEFAULT 0,
      last_deleted_abandoned INTEGER DEFAULT 0, last_deleted_write_leases INTEGER DEFAULT 0,
      last_backlog_lower_bound INTEGER DEFAULT 0, last_scan_has_more INTEGER DEFAULT 0,
      last_duration_ms INTEGER, last_error_code TEXT, updated_at TEXT);
    INSERT INTO _emdash_media_usage_cleanup (task_key, next_eligible_at, last_started_at, last_completed_at,
      last_duration_ms, updated_at) VALUES ('projection_gc', '2026-10-08T00:15:00.000Z',
      '2026-10-08T00:00:00.000Z', '2026-10-08T00:00:00.000Z', 1, '2026-10-08T00:00:00.000Z');`);
  const directory = new URL('../../prisma/migrations/', import.meta.url);
  for (const migration of readdirSync(directory)
    .filter((name) => name.endsWith('.sql'))
    .sort())
    db.exec(readFileSync(new URL(migration, directory), 'utf8'));
  db.exec(`CREATE TABLE AcceptedContent (id TEXT PRIMARY KEY, snapshot TEXT, media TEXT);
    INSERT INTO AcceptedContent VALUES ('current', 'snapshot_kept', 'media_kept');
    INSERT INTO AvailabilityAlertSendDay (day, sentCount) VALUES ('2026-10-08', 7);`);
  const [sourceAccount, targetAccount] = accountMap[environment];
  const source = provider(sourceAccount, environment === 'prd');
  const target = provider(targetAccount, environment === 'prd');
  const add = (
    slug: string,
    options: {
      published?: boolean;
      initialized?: boolean;
      paused?: boolean;
      soldOut?: boolean;
      custom?: boolean;
      inactive?: boolean;
      noOffer?: boolean;
    } = {},
  ) => {
    const variantId = `variant_${slug}`;
    const metadata = {
      appEnv: environment,
      sourceKind: 'distro',
      sourceId: `source_${slug}`,
      storeItemSlug: slug,
      variantId,
    };
    const projection = {
      name: `Runtime ${slug}`,
      description: 'Runtime editorial description',
      imageUrls: [runtimeImage],
      metadata: { display: 'kept' },
      taxCode: 'txcd_99999999',
    };
    cmsDb
      .prepare("INSERT INTO ec_distro VALUES (?, ?, ?, '{}', ?, ?, '2026-10-08', 1)")
      .run(
        `cms_${slug}`,
        `source_${slug}`,
        options.published ? 'published' : 'draft',
        options.published ? `live_${slug}` : null,
        `draft_${slug}`,
      );
    db.prepare(
      `INSERT INTO StoreItemOption (id, storeItemSlug, sourceKind, sourceId, variantId, cmsSourceId, itemType,
      priceKind, productProjection, catalogAvailability, catalogRevision, updatedAt) VALUES (?, ?, 'distro', ?, ?, ?, 'vinyl', ?, ?, ?, ?, 'before')`,
    ).run(
      `item_${slug}`,
      slug,
      metadata.sourceId,
      variantId,
      `cms_${slug}`,
      options.custom ? 'pay_what_you_want' : 'fixed',
      JSON.stringify(projection),
      options.published ? 'published' : 'withheld',
      options.initialized === false ? 0 : 1,
    );
    db.prepare(
      `INSERT INTO Stock (id, variantId, quantity, onlineQuantity, zeroStockState, expectedMonth, showLowStock,
      preorderStartedAt, preorderShipMonth, preorderShipPart, preorderShipDate, updatedAt) VALUES (?, ?, ?, ?, 'repressing', '2027-02', 1, 'start', '2027-03', 'late', NULL, 'before')`,
    ).run(`stock_${slug}`, variantId, options.soldOut ? 0 : 4, options.soldOut ? 0 : 3);
    db.prepare(
      `INSERT INTO ItemAvailability (id, variantId, status, canBuy, updatedAt) VALUES (?, ?, ?, ?, 'before')`,
    ).run(`availability_${slug}`, variantId, options.soldOut ? 'sold_out' : 'available', Number(!options.paused));
    if (options.initialized === false) return;
    const productId = `prod_source_${slug}`,
      priceId = `price_source_${slug}`;
    source.products.push({
      id: productId,
      name: 'Old provider name',
      description: 'Old provider description',
      images: ['https://old.example/image.jpg'],
      active: !options.inactive,
      tax_code: 'txcd_99999999',
      metadata,
      livemode: environment === 'prd',
      default_price: priceId,
    } as unknown as Product);
    source.prices.push({
      id: priceId,
      product: productId,
      active: !options.inactive,
      currency: 'eur',
      tax_behavior: 'inclusive',
      type: 'one_time',
      livemode: environment === 'prd',
      lookup_key: null,
      metadata,
      unit_amount: options.custom ? null : 1750,
      custom_unit_amount: options.custom ? { minimum: 500, maximum: null, preset: 1750 } : null,
    } as unknown as Price);
    db.prepare(
      `INSERT INTO VariantStripeMapping (id, variantId, stripePriceId, stripeProductId, updatedAt) VALUES (?, ?, ?, ?, 'before')`,
    ).run(`mapping_${slug}`, variantId, priceId, productId);
    if (!options.noOffer)
      db.prepare(
        `INSERT INTO StoreOfferSnapshot (id, storeItemSlug, variantId, stripePriceId,
      stripeLookupKey, amountMinor, currencyCode, priceActive, productActive, syncedAt, freshUntil, updatedAt)
      VALUES (?, ?, ?, ?, ?, 1700, 'EUR', 1, 1, 'before', 'before', 'before')`,
      ).run(`offer_${slug}`, slug, variantId, priceId, `blackbox:${environment}:${slug}:${variantId}`);
  };
  add('published', { published: true });
  db.exec(`INSERT INTO AvailabilityAlert (id, variantId, email, consentCopyVersion, consentedAt, status, attemptCount,
    nextAttemptAt, leaseUntil, createdAt, updatedAt) VALUES ('alert_kept', 'variant_published', 'buyer@example.test',
    'copy_kept', '2026-10-07', 'pending', 2, '2026-10-09', NULL, '2026-10-07', '2026-10-08');
    INSERT INTO CheckoutOrder (id, storeItemSlug, variantId, checkoutSessionId, checkoutExpiresAt, stripePaymentIntentId,
      amountTotalMinor, currencyCode, status, statusUpdatedAt, paidAt, updatedAt)
    VALUES ('order_kept', 'published', 'variant_published', 'cs_history_kept', '2026-10-01', 'pi_history_kept',
      2000, 'EUR', 'paid', '2026-10-01', '2026-10-01', '2026-10-01');
    INSERT INTO CheckoutOrderLine (id, orderId, storeItemSlug, variantId, stripePriceId, quantity, unitAmountMinor, lineAmountMinor)
    VALUES ('line_kept', 'order_kept', 'published', 'variant_published', 'price_history_kept', 1, 1750, 1750);
    INSERT INTO StripeCatalogWebhookEvent (eventId, eventType, catalogObjectId, catalogObjectKind, variantId, stripeCreatedAt)
    VALUES ('evt_history_kept', 'product.updated', 'prod_history_kept', 'product', 'variant_published', '2026-10-01');
    INSERT INTO CatalogOperation (id, kind, inputFingerprint, actorEmail, variantId, expectedRevision, step, status, results)
    VALUES ('operation_kept', 'price_change', 'shape_kept', 'operator@example.test', 'variant_published', 0, 'completed', 'completed', '{"stripePriceId":"price_history_kept"}');`);
  const captured: AccountMigrationJournal[] = [];
  let failBatch = 0,
    batches = 0,
    failSave = 0;
  const dependencies = {
    cmsDatabase: {
      query: async (statement: string) =>
        cmsDb.prepare(statement).all() as Array<Record<string, string | number | null>>,
    },
    database: {
      query: async (statement: string) => db.prepare(statement).all() as Array<Record<string, string | number | null>>,
      batch: async (statements: string[]) => {
        batches++;
        if (failBatch === batches) throw new Error('Interrupted before D1 batch');
        db.exec('BEGIN');
        try {
          for (const statement of statements) db.exec(statement);
          db.exec('COMMIT');
        } catch (error) {
          db.exec('ROLLBACK');
          throw error;
        }
      },
    },
    source: source.gateway,
    target: target.gateway,
    checkImage: async (url: string) => {
      expect(url).toBe(runtimeImage);
    },
    saveJournal: async (journal: AccountMigrationJournal) => {
      if (failSave && journal.steps.filter((step) => step.mode === 'apply').length === failSave)
        throw new Error('Interrupted after D1 commit');
      captured.push(structuredClone(journal));
    },
  };
  const plan = () =>
    planAccountMigration(
      { environment, sourceAccount, targetAccount, databaseIdentity: 'fixture/database' },
      dependencies,
    );
  const execute = (
    manifest: AccountMigrationManifest,
    journal: AccountMigrationJournal,
    extra: Partial<Parameters<typeof executeAccountMigration>[2]> = {},
  ) =>
    executeAccountMigration(
      manifest,
      journal,
      { mode: 'apply', reviewedHash: manifest.hash, confirmLiveChanges: environment === 'prd', ...extra },
      dependencies,
    );
  const journal = (manifest: AccountMigrationManifest): AccountMigrationJournal => ({
    version: 2,
    manifestHash: manifest.hash,
    rows: {},
    steps: [],
    bookkeeping: [],
  });
  const baseline = () =>
    db
      .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((row) => ({ name: row.name, rows: db.prepare(`SELECT * FROM "${row.name}"`).all() }));
  return {
    db,
    cmsDb,
    source,
    target,
    add,
    plan,
    execute,
    journal,
    captured,
    baseline,
    dependencies,
    interruptBatch: (at: number) => {
      failBatch = at;
    },
    interruptSave: (at: number) => {
      failSave = at;
    },
  };
}

describe('reviewed account migration', () => {
  it.each(['uat', 'prd'] as const)(
    'keeps %s custom snapshots consistent with the reconciler across apply, restore and reapply',
    async (environment) => {
      const f = fixture(environment);
      f.add('custom', { custom: true, published: true });
      f.source.prices.find((price) => price.id === 'price_source_custom')!.custom_unit_amount!.maximum = 10_000;
      f.db.exec("UPDATE StoreOfferSnapshot SET amountMinor = NULL WHERE variantId = 'variant_custom'");
      const original = f.baseline();
      const manifest = await f.plan(),
        journal = f.journal(manifest);
      const reconcile = async () => {
        const rows = f.db
          .prepare(createD1CatalogReadSql(manifest.rows.map((row) => ({ variantId: String(row.item.variantId) }))))
          .all() as D1CatalogRow[];
        const repositories = createD1CatalogRepositories(environment, rows);
        return new CatalogReconciler({
          environment,
          ...repositories,
          stripeCatalog: f.target.gateway,
        }).verifyBuyableCatalog({ apply: false });
      };

      await f.execute(manifest, journal);
      for (let pass = 0; pass < 2; pass++) {
        expect(f.db.prepare('SELECT variantId, amountMinor FROM StoreOfferSnapshot ORDER BY variantId').all()).toEqual([
          { variantId: 'variant_custom', amountMinor: null },
          { variantId: 'variant_published', amountMinor: 1750 },
        ]);
        const result = await reconcile();
        expect(result.issues).toEqual([]);
        expect(result.results.flatMap((item) => item.actions)).toEqual([]);
        if (pass === 0) {
          await f.execute(manifest, journal, { mode: 'restore' });
          expect(f.baseline()).toEqual(original);
          await f.execute(manifest, journal);
        }
      }
      expect(f.target.counts()).toEqual({ products: 2, prices: 2 });

      f.db.exec("UPDATE StoreOfferSnapshot SET amountMinor = 1750 WHERE variantId = 'variant_custom'");
      const oldPresetState = f.baseline();
      expect((await reconcile()).issues.map((issue) => issue.code)).toContain('snapshot_mismatch');
      for (const mode of ['apply', 'restore'] as const)
        await expect(f.execute(manifest, journal, { mode })).rejects.toThrow(
          'Current mapping or offer changed outside the migration',
        );
      expect(f.baseline()).toEqual(oldPresetState);
    },
  );

  it.each([undefined, null, {}, '[]', 0])('rejects a D1 SELECT without a row array (%j)', (results) => {
    expect(() => parseAccountMigrationQueryRows(results)).toThrow('D1 migration SELECT returned invalid rows');
  });
  it.each([
    { label: 'empty', rows: [] },
    { label: 'nonempty', rows: [{ id: 1, value: null }] },
  ])('preserves a valid $label D1 SELECT array', ({ rows }) => {
    expect(parseAccountMigrationQueryRows(rows)).toBe(rows);
  });
  it('prints a safe actionable CLI reason and never echoes raw provider messages', () => {
    const script = fileURLToPath(new URL('../../scripts/migrate-stripe-account.ts', import.meta.url));
    const result = spawnSync(process.execPath, ['--import', 'tsx', script, '--unknown'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15_000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Unknown or incomplete migration argument');
    expect(formatAccountMigrationError(new Error('private provider ID and key'))).not.toContain('private provider');
  });
  it.each(['uat', 'prd'] as const)(
    'verifies the %s Worker artwork and Pages content URLs unchanged',
    async (environment) => {
      const profile = productEnvironmentProfileFromWorkerRuntimeTarget(environment);
      const other = productEnvironmentProfileFromWorkerRuntimeTarget(environment === 'uat' ? 'prd' : 'uat');
      const published = `${profile.publicBackendOrigin}/media/published/${'a'.repeat(64)}`;
      const content = `${profile.publicSite.origin}/media/content/${'a'.repeat(64)}`;
      const requested: string[] = [];
      let canceled = 0;
      const request: typeof fetch = async (input, options) => {
        expect(options).toMatchObject({ method: 'GET', redirect: 'error' });
        requested.push(input.toString());
        return new Response(
          new ReadableStream({
            cancel() {
              canceled++;
            },
          }),
          { headers: { 'content-type': 'image/webp' } },
        );
      };
      for (const value of [published, content])
        await expect(verifyAccountMigrationImage(value, environment, request)).resolves.toBeUndefined();
      for (const value of [
        `${other.publicBackendOrigin}/media/published/${'a'.repeat(64)}`,
        `${other.publicSite.origin}/media/content/${'a'.repeat(64)}`,
        `${profile.publicSite.origin}/media/published/${'a'.repeat(64)}`,
        `${profile.publicBackendOrigin}/media/content/${'a'.repeat(64)}`,
        published.replace('/media/published/', '/assets/catalog/'),
        published.replace('https:', 'http:'),
        published.replace(/a$/, 'g'),
        published + '?width=1200',
        published + '#image',
      ])
        await expect(verifyAccountMigrationImage(value, environment, request)).rejects.toThrow('environment');
      expect(requested).toEqual([published, content]);
      expect(canceled).toBe(2);
    },
  );
  it('rejects unreachable, redirected and non-image responses', async () => {
    for (const [status, contentType] of [
      [404, 'image/webp'],
      [302, 'image/webp'],
      [200, 'text/html'],
    ] as const)
      await expect(
        verifyAccountMigrationImage(
          image,
          'uat',
          async () =>
            new Response('image', {
              status,
              headers: { 'content-type': contentType },
            }),
        ),
      ).rejects.toThrow('resolve');
  });
  it('defaults to a read-only plan and rejects Local, wrong pinned accounts and duplicate arguments', () => {
    const args = [
      '--env',
      'uat',
      '--source-account',
      accountMap.uat[0],
      '--target-account',
      accountMap.uat[1],
      '--manifest',
      'private.json',
    ];
    expect(parseAccountMigrationArgs(args).mode).toBe('plan');
    expect(() => parseAccountMigrationArgs([...args, '--env', 'prd'])).toThrow();
    expect(() => parseAccountMigrationArgs(args.map((arg) => (arg === 'uat' ? 'local' : arg)))).toThrow();
    expect(() =>
      parseAccountMigrationArgs(args.map((arg) => (arg === accountMap.uat[1] ? accountMap.prd[1] : arg))),
    ).toThrow();
  });

  it.each(['source', 'target'] as const)(
    'asserts the exact %s account and mode before reading or writing catalog state',
    async (side) => {
      const f = fixture();
      const manifest = await f.plan();
      f[side].api.accounts.retrieveCurrent = async () => ({ id: 'acct_wrong' });
      await expect(f.execute(manifest, f.journal(manifest))).rejects.toThrow('account or mode');
      f[side].api.accounts.retrieveCurrent = async () => ({ id: accountMap.uat[side === 'source' ? 0 : 1] });
      f[side].api.balance.retrieve = async () => ({ livemode: true });
      await expect(f.execute(manifest, f.journal(manifest))).rejects.toThrow('account or mode');
      expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
    },
  );

  it('requires a reviewed hash, rejects edited manifests and refuses PRD without live confirmation', async () => {
    const f = fixture('prd');
    const manifest = await f.plan();
    await expect(f.execute(manifest, f.journal(manifest), { confirmLiveChanges: false })).rejects.toThrow(
      'confirm-live',
    );
    await expect(f.execute(manifest, f.journal(manifest), { reviewedHash: '0'.repeat(64) })).rejects.toThrow('hash');
    const altered = structuredClone(manifest);
    altered.rows[0]!.item.catalogRevision = 99;
    await expect(f.execute(altered, f.journal(manifest))).rejects.toThrow('hash');
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
  });

  it.each(['apply', 'restore'] as const)('rejects version 1 manifests and journals before %s', async (mode) => {
    const f = fixture();
    const manifest = await f.plan();
    const canonicalJson = (value: unknown): string => {
      if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
      if (value && typeof value === 'object')
        return `{${Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
          .join(',')}}`;
      return JSON.stringify(value);
    };
    const { hash: originalHash, ...body } = manifest;
    const oldBody = { ...body, version: 1 };
    const oldHash = createHash('sha256').update(canonicalJson(oldBody)).digest('hex');
    expect(oldHash).not.toBe(originalHash);
    const oldManifest = { ...oldBody, hash: oldHash } as unknown as AccountMigrationManifest;
    await expect(f.execute(oldManifest, f.journal(oldManifest), { mode })).rejects.toThrow('hash or schema');
    const oldJournal = { ...f.journal(manifest), version: 1 } as unknown as AccountMigrationJournal;
    await expect(f.execute(manifest, oldJournal, { mode })).rejects.toThrow('Journal');
    expect(f.captured).toEqual([]);
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
  });

  it('exports multiple SQLite pages with unpaged canonical hashes and exact-multiple EOF', async () => {
    const f = fixture();
    const histories = [
      { db: f.db, database: f.dependencies.database, count: 2501, key: 'PagingHistory' },
      { db: f.cmsDb, database: f.dependencies.cmsDatabase, count: 2000, key: 'CMS:PagingHistory' },
    ];
    for (const history of histories) {
      history.db.exec(`CREATE TABLE PagingHistory (id INTEGER PRIMARY KEY, label TEXT, note TEXT, amount REAL);
        WITH RECURSIVE sequence(id) AS (
          SELECT 1 UNION ALL SELECT id + 1 FROM sequence WHERE id < ${history.count}
        )
        INSERT INTO PagingHistory SELECT id, 'Δοκιμή ' || id,
          CASE WHEN id % 2 = 0 THEN NULL ELSE 'with "quotes"' END, id / 10.0 FROM sequence;`);
    }
    const pages = histories.map(() => [] as Array<{ sql: string; rows: number }>);
    for (const [index, history] of histories.entries()) {
      const query = history.database.query;
      history.database.query = async (statement) => {
        const rows = await query(statement);
        if (statement.startsWith('SELECT * FROM "PagingHistory"'))
          pages[index]!.push({ sql: statement, rows: rows.length });
        return rows;
      };
    }
    const manifest = await f.plan();
    for (const [index, history] of histories.entries()) {
      const rows = history.db.prepare('SELECT * FROM PagingHistory').all();
      const canonicalRows = rows.map((row) =>
        JSON.stringify(Object.fromEntries(Object.entries(row).sort(([a], [b]) => a.localeCompare(b)))),
      );
      const expectedHash = createHash('sha256').update(JSON.stringify(canonicalRows.sort())).digest('hex');
      expect(manifest.preserved[history.key]).toEqual({ count: history.count, hash: expectedHash });
      expect(pages[index]).toEqual([
        { sql: 'SELECT * FROM "PagingHistory" LIMIT 1000 OFFSET 0', rows: 1000 },
        { sql: 'SELECT * FROM "PagingHistory" LIMIT 1000 OFFSET 1000', rows: 1000 },
        { sql: 'SELECT * FROM "PagingHistory" LIMIT 1000 OFFSET 2000', rows: history.count - 2000 },
      ]);
    }
  });

  it.each([99_999, 100_000])('keeps the protected export ceiling at %i rows', async (count) => {
    const f = fixture();
    f.db.exec(`CREATE TABLE PagingHistory AS
      WITH RECURSIVE sequence(id) AS (
        SELECT 1 UNION ALL SELECT id + 1 FROM sequence WHERE id < ${count}
      ) SELECT id FROM sequence;`);
    const statements: string[] = [];
    const query = f.dependencies.database.query;
    f.dependencies.database.query = async (statement) => {
      if (statement.startsWith('SELECT * FROM "PagingHistory"')) statements.push(statement);
      return query(statement);
    };
    if (count < 100_000) expect((await f.plan()).preserved.PagingHistory!.count).toBe(count);
    else await expect(f.plan()).rejects.toThrow('Protected-data export exceeds 100,000 rows');
    expect(statements).toHaveLength(100);
    expect(statements.at(-1)).toBe('SELECT * FROM "PagingHistory" LIMIT 1000 OFFSET 99000');
    expect(f.captured).toEqual([]);
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
  });

  it('allows only idle scheduler bookkeeping drift and retains each private boundary observation', async () => {
    const f = fixture();
    const original = f.baseline();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    let tick = 0;
    const advanceBookkeeping = () => {
      tick++;
      const completedAt = `2026-10-08T00:0${tick}:00.000Z`;
      f.cmsDb
        .prepare("UPDATE options SET value = ?, revision = ? WHERE name = 'system:scheduler:last_completed_at'")
        .run(JSON.stringify(completedAt), `heartbeat_${tick}`);
      f.cmsDb
        .prepare(
          `UPDATE _emdash_media_usage_cleanup SET next_eligible_at = ?, last_started_at = ?,
          last_completed_at = ?, last_duration_ms = ?, updated_at = ? WHERE task_key = 'projection_gc'`,
        )
        .run(completedAt, completedAt, completedAt, tick + 1, completedAt);
    };
    advanceBookkeeping();
    const prepare = f.dependencies.target.ensureAccountCatalog.bind(f.dependencies.target);
    f.dependencies.target.ensureAccountCatalog = async (input) => {
      const result = await prepare(input);
      advanceBookkeeping();
      return result;
    };
    const batch = f.dependencies.database.batch;
    f.dependencies.database.batch = async (statements) => {
      await batch(statements);
      advanceBookkeeping();
    };
    await f.execute(manifest, journal, { prepareOnly: true });
    expect(f.baseline()).toEqual(original);
    await f.execute(manifest, journal);
    await f.execute(manifest, journal, { mode: 'restore' });
    expect(f.baseline()).toEqual(original);
    expect((await f.plan()).preserved).toEqual(manifest.preserved);
    expect(manifest.bookkeeping.schedulerHeartbeat!.revision).toBe('heartbeat_before');
    expect(journal.bookkeeping.map((entry) => `${entry.mode}:${entry.phase}`)).toEqual([
      'apply:before',
      'apply:prepared',
      'apply:before',
      'apply:prepared',
      'apply:after',
      'restore:before',
      'restore:prepared',
      'restore:after',
    ]);
    expect(journal.bookkeeping.map((entry) => entry.observed.schedulerHeartbeat!.revision)).toEqual([
      'heartbeat_1',
      'heartbeat_2',
      'heartbeat_2',
      'heartbeat_2',
      'heartbeat_3',
      'heartbeat_3',
      'heartbeat_3',
      'heartbeat_4',
    ]);
    expect(journal.bookkeeping.at(-1)!.observed.mediaUsageCleanup).toEqual(
      f.cmsDb.prepare("SELECT * FROM _emdash_media_usage_cleanup WHERE task_key = 'projection_gc'").get(),
    );
    expect(f.captured.at(-1)!.bookkeeping).toEqual(journal.bookkeeping);
    expect(f.target.counts()).toEqual({ products: 1, prices: 1 });
  });

  it.each([
    "UPDATE options SET value = 'false' WHERE name = 'seed:complete'",
    "UPDATE options SET revision = 'changed' WHERE name = 'seed:complete'",
    "UPDATE options SET name = 'renamed' WHERE name = 'system:scheduler:last_completed_at'",
    "DELETE FROM options WHERE name = 'system:scheduler:last_completed_at'",
    "INSERT INTO options VALUES ('added', 'true', 'new')",
    "UPDATE _emdash_media_usage_cleanup SET task_key = 'renamed'",
    'DELETE FROM _emdash_media_usage_cleanup',
    "UPDATE _emdash_media_usage_cleanup SET lease_token = 'claimed'",
    "UPDATE _emdash_media_usage_cleanup SET lease_expires_at = '2026-10-08T01:00:00.000Z'",
    "UPDATE _emdash_media_usage_cleanup SET cursor_created_at = '2026-10-07T00:00:00.000Z'",
    "UPDATE _emdash_media_usage_cleanup SET cursor_id = 'changed'",
    "UPDATE _emdash_media_usage_cleanup SET scan_before_at = '2026-10-08T00:00:00.000Z'",
    'UPDATE _emdash_media_usage_cleanup SET consecutive_failures = 1',
    'UPDATE _emdash_media_usage_cleanup SET last_candidate_count = 1',
    'UPDATE _emdash_media_usage_cleanup SET last_deleted_orphans = 1',
    'UPDATE _emdash_media_usage_cleanup SET last_deleted_stale = 1',
    'UPDATE _emdash_media_usage_cleanup SET last_deleted_abandoned = 1',
    'UPDATE _emdash_media_usage_cleanup SET last_deleted_write_leases = 1',
    'UPDATE _emdash_media_usage_cleanup SET last_backlog_lower_bound = 1',
    'UPDATE _emdash_media_usage_cleanup SET last_scan_has_more = 1',
    "UPDATE _emdash_media_usage_cleanup SET last_error_code = 'failed'",
    "UPDATE media SET url = '/media/content/changed'",
    'UPDATE ec_distro SET data = \'{"title":"Changed"}\'',
    "UPDATE ec_distro SET draft_revision_id = 'changed'",
    'UPDATE ec_distro SET version = version + 1',
    'ALTER TABLE options ADD COLUMN extra TEXT',
    'ALTER TABLE _emdash_media_usage_cleanup ADD COLUMN extra TEXT',
  ])('retains the hard CMS drift guard for %s', async (statement) => {
    const f = fixture();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    f.cmsDb.exec(statement);
    await expect(f.execute(manifest, journal)).rejects.toThrow('Protected data changed');
    expect(journal.bookkeeping).toHaveLength(1);
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
  });

  it('protects timing fields of every other cleanup task', async () => {
    const f = fixture();
    f.cmsDb.exec("INSERT INTO _emdash_media_usage_cleanup (task_key) VALUES ('other_task')");
    const manifest = await f.plan();
    f.cmsDb.exec("UPDATE _emdash_media_usage_cleanup SET updated_at = 'changed' WHERE task_key = 'other_task'");
    await expect(f.execute(manifest, f.journal(manifest))).rejects.toThrow('Protected data changed');
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
  });

  it('includes withheld, paused, sold-out, CMS-only and uninitialized rows using runtime media and source prices', async () => {
    const f = fixture();
    f.add('cms-only', { custom: true, paused: true, inactive: true });
    f.add('sold-out', { soldOut: true, noOffer: true });
    f.add('uninitialized', { initialized: false, paused: true });
    const original = f.baseline();
    const manifest = await f.plan();
    expect(manifest.rows).toHaveLength(4);
    expect(manifest.preserved['CMS:ec_distro']!.count).toBe(5);
    expect(manifest.cmsSources.find((source) => source.id === 'unlinked-cms')).toMatchObject({
      slug: 'cms-without-catalog',
      catalogVariantId: null,
      liveRevisionId: null,
      draftRevisionId: 'revision_kept',
    });
    const cmsOriginal = f.cmsDb.prepare('SELECT * FROM ec_distro').all();
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
    expect(manifest.rows.find((row) => row.item.storeItemSlug === 'uninitialized')!.sourcePrice).toBeNull();
    expect(
      manifest.rows.find((row) => row.item.storeItemSlug === 'cms-only')!.sourcePrice!.customUnitAmount!
        .maximumAmountMinor,
    ).toBeNull();
    const journal = f.journal(manifest);
    await f.execute(manifest, journal, { prepareOnly: true });
    expect(f.baseline()).toEqual(original);
    await f.execute(manifest, journal);
    expect(f.target.counts()).toEqual({ products: 3, prices: 3 });
    expect(f.cmsDb.prepare('SELECT * FROM ec_distro').all()).toEqual(cmsOriginal);
    expect(
      f.target.products.every((product) => product.images[0] === image && product.name.startsWith('Runtime')),
    ).toBe(true);
    const paused = f.target.products.find((product) => product.metadata.storeItemSlug === 'cms-only')!;
    expect(paused.active).toBe(false);
    expect(f.target.prices.find((price) => price.product === paused.id)!.active).toBe(false);
    const applied = f.baseline();
    expect(
      applied.filter((table) => !['VariantStripeMapping', 'StoreOfferSnapshot'].includes(String(table.name))),
    ).toEqual(original.filter((table) => !['VariantStripeMapping', 'StoreOfferSnapshot'].includes(String(table.name))));
    await f.execute(manifest, journal);
    expect(f.baseline()).toEqual(applied);
    await f.execute(manifest, journal, { mode: 'restore' });
    expect(f.baseline()).toEqual(original);
    await f.execute(manifest, journal, { mode: 'restore' });
    await f.execute(manifest, journal);
    expect(f.baseline()).toEqual(applied);
    expect(f.target.counts()).toEqual({ products: 3, prices: 3 });
  });

  it('accounts for a Product-bound/no-Price setup without inventing a catalog binding', async () => {
    const f = fixture();
    f.add('product-only', { initialized: false });
    f.db
      .exec(`INSERT INTO CatalogOperation (id, kind, inputFingerprint, actorEmail, variantId, expectedRevision, step, status, results)
      VALUES ('setup_kept', 'item_setup', 'shape_kept', 'operator@example.test', 'variant_product-only', 0,
      'product_bound', 'needs_review', '{"stripeProductId":"prod_uninitialized_kept","cmsSourceId":"cms_product-only"}');`);
    const original = f.baseline();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    expect(manifest.rows.find((row) => row.item.storeItemSlug === 'product-only')!.mapping).toBeNull();
    await f.execute(manifest, journal);
    await f.execute(manifest, journal, { mode: 'restore' });
    expect(f.baseline()).toEqual(original);
    expect(f.target.counts()).toEqual({ products: 1, prices: 1 });
  });

  it('preserves a zero-revision draft with a partial Price binding and its original source handling receipt', async () => {
    const f = fixture();
    f.add('price-bound-draft');
    f.db.exec("UPDATE StoreItemOption SET catalogRevision = 0 WHERE storeItemSlug = 'price-bound-draft'");
    const original = f.baseline();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    const partial = manifest.rows.find((row) => row.item.storeItemSlug === 'price-bound-draft')!;
    expect(partial.mapping!.stripePriceId).toBe('price_source_price-bound-draft');
    expect(partial.targetProductId).toBeNull();
    await f.execute(manifest, journal);
    expect(
      f.db
        .prepare("SELECT stripePriceId FROM VariantStripeMapping WHERE variantId = 'variant_price-bound-draft'")
        .get()!.stripePriceId,
    ).toBe('price_source_price-bound-draft');
    await f.execute(manifest, journal, { mode: 'restore' });
    expect(f.baseline()).toEqual(original);
    expect(f.target.counts()).toEqual({ products: 1, prices: 1 });
  });

  it('rejects CMS content/pointer drift and conflicting source/slug metadata on the same target variant', async () => {
    const f = fixture();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    f.cmsDb.exec("UPDATE publication SET snapshot = 'changed'");
    await expect(f.execute(manifest, journal)).rejects.toThrow('Protected data changed');
    f.cmsDb.exec("UPDATE publication SET snapshot = 'accepted_snapshot_kept'");
    f.target.products.push({
      id: 'prod_conflicting',
      active: true,
      metadata: {
        appEnv: 'uat',
        variantId: 'variant_published',
        storeItemSlug: 'different-slug',
        sourceKind: 'distro',
        sourceId: 'different-source',
      },
    } as unknown as Product);
    await expect(f.execute(manifest, journal)).rejects.toThrow('ambiguous');
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
  });

  it.each(['product', 'price', 'default'] as const)(
    'recovers a lost %s response with no idempotency cache or retained object ID',
    async (stage) => {
      const f = fixture();
      const manifest = await f.plan();
      const journal = f.journal(manifest);
      f.target.crashAfter(stage);
      await expect(f.execute(manifest, journal)).rejects.toThrow('Connection lost');
      expect(journal.rows).toEqual({});
      await f.execute(manifest, journal);
      expect(f.target.counts()).toEqual({ products: 1, prices: 1 });
    },
  );

  it('resumes a partial apply and an interrupted inverse restore', async () => {
    const f = fixture();
    f.add('withheld');
    const original = f.baseline();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    f.interruptBatch(2);
    await expect(f.execute(manifest, journal)).rejects.toThrow('Interrupted');
    f.interruptBatch(0);
    await f.execute(manifest, journal);
    f.interruptBatch(5);
    await expect(f.execute(manifest, journal, { mode: 'restore' })).rejects.toThrow('Interrupted');
    f.interruptBatch(0);
    await f.execute(manifest, journal, { mode: 'restore' });
    expect(f.baseline()).toEqual(original);
    expect(f.target.counts()).toEqual({ products: 2, prices: 2 });
  });

  it('recovers a D1 commit before its journal completion record', async () => {
    const f = fixture();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    f.interruptSave(1);
    await expect(f.execute(manifest, journal)).rejects.toThrow('after D1 commit');
    const durableJournal = f.captured.at(-1)!;
    expect(durableJournal.steps.every((step) => step.mode === 'prepare')).toBe(true);
    f.interruptSave(0);
    await f.execute(manifest, durableJournal);
    await f.execute(manifest, durableJournal, { mode: 'restore' });
    expect(f.target.counts()).toEqual({ products: 1, prices: 1 });
  });

  it.each([
    'UPDATE StoreItemOption SET catalogRevision = catalogRevision + 1',
    'UPDATE Stock SET onlineQuantity = onlineQuantity + 1',
    'UPDATE ItemAvailability SET canBuy = 0',
    "UPDATE AcceptedContent SET snapshot = 'changed'",
    'UPDATE AvailabilityAlertSendDay SET sentCount = 8',
    "UPDATE VariantStripeMapping SET stripePriceId = 'price_changed'",
    'UPDATE StoreOfferSnapshot SET amountMinor = 999',
  ])('refuses stale rows/protected data: %s', async (change) => {
    const f = fixture();
    const manifest = await f.plan();
    f.db.exec(change);
    await expect(f.execute(manifest, f.journal(manifest))).rejects.toThrow(/changed/);
    expect(f.target.counts()).toEqual({ products: 0, prices: 0 });
  });

  it('refuses source default-Price drift and all-manifest destination drift on unpublished items', async () => {
    const f = fixture();
    f.add('withheld');
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    f.source.prices[0]!.unit_amount = 999;
    await expect(f.execute(manifest, journal)).rejects.toThrow('Source provider facts changed');
    f.source.prices[0]!.unit_amount = 1750;
    await f.execute(manifest, journal, { prepareOnly: true });
    f.target.products.find((product) => product.metadata.storeItemSlug === 'withheld')!.images = [
      'https://old.example/asset.jpg',
    ];
    await expect(f.execute(manifest, journal)).rejects.toThrow('does not match');
    expect(
      f.db.prepare("SELECT stripePriceId FROM VariantStripeMapping WHERE variantId = 'variant_published'").get()!
        .stripePriceId,
    ).toBe('price_source_published');
  });

  it('stops on ambiguous Price recovery and foreign lookup-key ownership', async () => {
    const f = fixture();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    f.target.crashAfter('price');
    await expect(f.execute(manifest, journal)).rejects.toThrow();
    f.target.prices.push({ ...f.target.prices[0]!, id: 'price_duplicate' });
    await expect(f.execute(manifest, journal)).rejects.toThrow('ambiguous');
    expect(f.target.counts()).toEqual({ products: 1, prices: 1 });
    f.target.prices.pop();
    f.target.prices.push({ ...f.target.prices[0]!, id: 'price_foreign', product: 'prod_foreign' });
    await expect(f.execute(manifest, journal)).rejects.toThrow('another Product');
  });

  it('rolls back both current rows on source guard or offer-write failure', async () => {
    const f = fixture();
    const manifest = await f.plan(),
      journal = f.journal(manifest);
    await f.execute(manifest, journal, { prepareOnly: true });
    const row = manifest.rows[0]!,
      original = f.baseline();
    f.db.exec(
      `CREATE TRIGGER reject_offer BEFORE UPDATE ON StoreOfferSnapshot BEGIN SELECT RAISE(ABORT, 'offer write failed'); END`,
    );
    await expect(f.dependencies.database.batch(accountMigrationBatch(row, journal, false))).rejects.toThrow(
      'offer write failed',
    );
    f.db.exec('DROP TRIGGER reject_offer');
    expect(f.baseline()).toEqual(original);
    f.db.exec('UPDATE StoreItemOption SET catalogRevision = catalogRevision + 1');
    await expect(f.dependencies.database.batch(accountMigrationBatch(row, journal, false))).rejects.toThrow(
      'malformed JSON',
    );
    expect(f.db.prepare('SELECT stripePriceId FROM VariantStripeMapping').get()!.stripePriceId).toBe(
      'price_source_published',
    );
  });
});
