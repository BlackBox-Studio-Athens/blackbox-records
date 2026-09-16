import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

type ObjectData = Record<string, unknown>;
type Catalog = { products: Record<string, ObjectData>; prices: Record<string, ObjectData> };

// Official stripe-mock validates requests but does not retain catalog writes. Keep this Local-only.
export function createLocalStripeMockCatalog(file?: string) {
  let state: Catalog = { products: {}, prices: {} };
  if (file) {
    try {
      state = JSON.parse(readFileSync(file, 'utf8')) as Catalog;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const save = () => {
    if (!file) return;
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file + '.next', JSON.stringify(state));
    renameSync(file + '.next', file);
  };
  return (input: { url: string; method: string; body: string; status: number; idempotencyKey?: string }) => {
    const url = new URL(input.url, 'http://127.0.0.1');
    const match = /^\/v1\/(products|prices)(?:\/([^/]+))?$/.exec(url.pathname);
    if (!match) return null;
    if (input.status >= 400 && input.status !== 404) return null;
    const kind = match[1] as keyof Catalog;
    const id = match[2] && decodeURIComponent(match[2]);
    const params = new URLSearchParams(input.body);
    const product = params.get('product') ?? url.searchParams.get('product');
    const owned =
      (id && Boolean(state[kind][id])) ||
      (product && Boolean(state.products[product])) ||
      (kind === 'products'
        ? !id || id.startsWith('prod_blackbox_')
        : id?.startsWith('price_local_') || product?.startsWith('prod_blackbox_'));
    if (!owned) return null;
    const reply = (status: number, value: unknown) => ({ status, body: JSON.stringify(value) });
    const missing = () =>
      reply(404, {
        error: { type: 'invalid_request_error', code: 'resource_missing', message: 'No such Local catalog object.' },
      });
    const expand = (value: ObjectData) => {
      const fields = [...url.searchParams].filter(([key]) => /^expand\[\d*\]$/.test(key)).map(([, value]) => value);
      if (kind === 'products' && fields.includes('default_price') && typeof value.default_price === 'string')
        return { ...value, default_price: state.prices[value.default_price] ?? value.default_price };
      if (
        kind === 'prices' &&
        fields.some((field) => field === 'product' || field === 'data.product') &&
        typeof value.product === 'string'
      )
        return { ...value, product: state.products[value.product] ?? value.product };
      return value;
    };
    if (input.method === 'GET') {
      if (id) return state[kind][id] ? reply(200, expand(state[kind][id])) : missing();
      let rows = Object.values(state[kind]).filter(
        (row) =>
          (!product || row.product === product) &&
          (!url.searchParams.has('active') || String(row.active) === url.searchParams.get('active')),
      );
      const after = url.searchParams.get('starting_after');
      if (after) rows = rows.slice(rows.findIndex((row) => row.id === after) + 1);
      const limit = Number(url.searchParams.get('limit') ?? 10);
      return reply(200, {
        object: 'list',
        url: url.pathname,
        data: rows.slice(0, limit).map(expand),
        has_more: rows.length > limit,
      });
    }
    if (input.method !== 'POST' || input.status >= 400) return null;
    if (id && !state[kind][id]) return missing();
    if (kind === 'prices' && product && !state.products[product]) return missing();
    const key =
      id ??
      (kind === 'products'
        ? params.get('id')
        : 'price_local_' +
          createHash('sha256')
            .update(input.idempotencyKey ?? randomUUID())
            .digest('hex')
            .slice(0, 32));
    if (!key || (kind === 'products' && !state.products[key] && !key.startsWith('prod_blackbox_'))) return null;
    if (!id && state[kind][key]) return reply(200, expand(state[kind][key]));
    const value: ObjectData = {
      ...(state[kind][key] ?? {
        id: key,
        object: kind === 'products' ? 'product' : 'price',
        active: true,
        livemode: false,
        created: Math.floor(Date.now() / 1000),
        metadata: {},
        ...(kind === 'products'
          ? { default_price: null, images: [], tax_code: null }
          : { type: 'one_time', recurring: null, custom_unit_amount: null }),
      }),
    };
    for (const field of [
      'name',
      'description',
      'currency',
      'product',
      'default_price',
      'tax_code',
      'tax_behavior',
      'lookup_key',
    ]) {
      if (params.has(field)) value[field] = params.get(field);
    }
    if (params.has('active')) value.active = params.get('active') === 'true';
    if (params.has('unit_amount')) value.unit_amount = Number(params.get('unit_amount'));
    if (params.has('custom_unit_amount[enabled]')) {
      value.unit_amount = null;
      value.custom_unit_amount = Object.fromEntries(
        ['minimum', 'maximum', 'preset'].map((field) => [field, Number(params.get(`custom_unit_amount[${field}]`))]),
      );
    }
    const metadata = { ...(value.metadata as Record<string, string>) };
    for (const [field, value] of params) {
      const match = /^metadata\[([^\]]+)\]$/.exec(field);
      if (match) metadata[match[1]] = value;
    }
    value.metadata = metadata;
    const images = [...params].filter(([field]) => /^images\[\d*\]$/.test(field)).map(([, value]) => value);
    if (images.length || params.has('images')) value.images = images;
    state[kind][key] = value;
    save();
    return reply(200, expand(value));
  };
}
