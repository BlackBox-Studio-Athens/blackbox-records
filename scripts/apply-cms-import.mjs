// Browser and Local imports use the same native API writes and identity checks.
export async function applyCmsImport(plan, readMedia, { apply = false, verifyOnly = false, progress = () => {} } = {}) {
  const target = new URL(plan.target);
  const local =
    target.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(target.hostname) &&
    ['8787', '8799'].includes(target.port);
  if (
    (!local && target.origin !== 'https://staff-uat.blackboxrecordsathens.com') ||
    target.href !== target.origin + '/'
  )
    throw new Error('Only Local and the exact UAT CMS are supported.');
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  check(!(apply && verifyOnly), 'Apply and read-only verification are separate operations.');
  const sha256 = async (blob) =>
    Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join('');
  const report = {
    target: target.origin,
    apply,
    verifyOnly,
    records: plan.records.length,
    media: plan.media.length,
    retainedAssets: plan.retainedAssets,
    createdRecords: 0,
    createdMedia: 0,
    identities: {},
    mediaIdentities: {},
  };
  // Validate every selected file before the first write, including repeat runs.
  for (const media of verifyOnly ? [] : plan.media) {
    const { file } = await readMedia(media);
    check(file.size === media.bytes && (await sha256(file)) === media.sha256, 'Source media differs: ' + media.path);
  }
  if (!apply && !verifyOnly) return report;
  async function request(route, method = 'GET', body) {
    check(!verifyOnly || method === 'GET', 'Read-only verification cannot write.');
    const form = body instanceof FormData;
    const response = await fetch(target.origin + '/_emdash/api' + route, {
      method,
      redirect: 'error',
      headers: { 'X-EmDash-Request': '1', ...(form ? {} : { 'Content-Type': 'application/json' }) },
      body: form ? body : body === undefined ? undefined : JSON.stringify(body),
    });
    const result = await response.json();
    if (response.status === 404 && method === 'GET') return null;
    check(response.ok, `${method} ${route}: ${response.status} ${JSON.stringify(result.error)}`);
    return result.data;
  }
  const identities = new Map();
  const storedMedia = [];
  if (verifyOnly) {
    let cursor;
    const seen = new Set();
    do {
      // ponytail: migration check is capped at 2,000 media objects; revise for a larger library.
      check(seen.size < 20 && !seen.has(cursor), 'Media pagination exceeded its bound or repeated a cursor.');
      seen.add(cursor);
      const page = await request('/media?limit=100' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''));
      storedMedia.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
  }
  for (const media of plan.media) {
    let saved;
    if (verifyOnly) {
      // The native SHA-1 is only a lookup hint. Downloaded bytes must still pass SHA-256 below.
      check(/^sha1:[a-f0-9]{40}$/.test(media.contentHash ?? ''), 'Regenerate the verification plan.');
      const matches = storedMedia.filter((item) => item.contentHash === media.contentHash);
      check(matches.length === 1, 'Missing or ambiguous stored media: ' + media.path);
      saved = { item: matches[0], deduplicated: true };
    } else {
      const { file, thumbnail } = await readMedia(media);
      check(
        file.size === media.bytes && (await sha256(file)) === media.sha256,
        'Source changed after validation: ' + media.path,
      );
      const form = new FormData();
      form.set('file', file, media.path.split('/').at(-1));
      form.set('deduplicate', 'true');
      form.set('width', String(media.width));
      form.set('height', String(media.height));
      form.set('thumbnail', thumbnail, 'thumbnail.png');
      saved = await request('/media', 'POST', form);
    }
    const downloadUrl = new URL(saved.item.url, target);
    check(
      downloadUrl.origin === target.origin && downloadUrl.pathname.startsWith('/_emdash/api/media/file/'),
      'Unexpected media URL',
    );
    const download = await fetch(downloadUrl, { redirect: 'error' });
    check(
      download.status === 200 && (await sha256(await download.blob())) === media.sha256,
      'Stored media differs: ' + media.path,
    );
    check(
      saved.item.width === media.width && saved.item.height === media.height,
      'Stored dimensions differ: ' + media.path,
    );
    identities.set('urn:blackbox:media:' + media.path, saved.item.id);
    report.mediaIdentities[media.path] = saved.item.id;
    if (!saved.deduplicated) report.createdMedia++;
    progress({ media: Object.keys(report.mediaIdentities).length, records: 0 });
  }
  function nativeData(value, expected) {
    if (typeof expected === 'boolean' && [0, 1].includes(value)) return value === 1;
    if (!value || typeof value !== 'object') return value;
    if (expected?.id && Object.keys(expected).length === 1) return { id: value.id };
    if (Array.isArray(value)) return value.map((item, index) => nativeData(item, expected?.[index]));
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, nativeData(item, expected?.[key])]));
  }
  const canonical = (value) =>
    JSON.stringify(value, (_, item) =>
      item && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
        : item,
    );
  for (const record of plan.records) {
    const data = JSON.parse(JSON.stringify(record.data), (_, value) => {
      if (typeof value !== 'string' || !value.startsWith('urn:blackbox:')) return value;
      check(identities.has(value), 'Unresolved import reference: ' + value);
      return identities.get(value);
    });
    const route = '/content/' + record.collection;
    const existing = await request(route + '/' + encodeURIComponent(record.slug));
    check(!verifyOnly || existing, 'Missing imported record: ' + record.source);
    if (existing) {
      const actual = Object.fromEntries(
        Object.entries(nativeData(existing.item.data, data)).filter(([, value]) => value !== null),
      );
      check(
        canonical(actual) === canonical(data),
        `Existing editorial content differs: ${record.source}. No overwrite was attempted.`,
      );
    }
    const saved = existing ?? (await request(route, 'POST', { slug: record.slug, data }));
    check(saved.item.slug === record.slug, 'CMS must preserve the source slug.');
    identities.set('urn:blackbox:record:' + record.identity, saved.item.id);
    report.identities[record.identity] = saved.item.id;
    if (!existing) report.createdRecords++;
    progress({ media: plan.media.length, records: Object.keys(report.identities).length });
  }
  if (verifyOnly) {
    for (const collection of new Set(plan.records.map((record) => record.collection))) {
      const listing = await request('/content/' + collection + '?limit=1');
      check(
        listing.total === plan.records.filter((record) => record.collection === collection).length,
        'Collection count differs: ' + collection,
      );
    }
  }
  return report;
}
