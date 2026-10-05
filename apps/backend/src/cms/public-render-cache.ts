type Page = { body: string; headers: [string, string][]; status: number };
type Row = { body: string; headers: string; status: number };

export const publicRenderCacheBytes = 8 * 1024 * 1024;
export const publicRenderPageBytes = 2 * 1024 * 1024;

/** Disposable published responses; the R2 accepted pointer remains authoritative after a restart. */
export class PublicRenderCache {
  private bytes: number;
  private sequence: number;
  private prefix: string | undefined;
  constructor(
    private sql: SqlStorage,
    private maxBytes = publicRenderCacheBytes,
  ) {
    sql.exec(`CREATE TABLE IF NOT EXISTS public_render_cache (
      key TEXT PRIMARY KEY, body TEXT NOT NULL, headers TEXT NOT NULL,
      status INTEGER NOT NULL, bytes INTEGER NOT NULL, used INTEGER NOT NULL
    )`);
    sql.exec('CREATE INDEX IF NOT EXISTS public_render_cache_used ON public_render_cache (used)');
    const totals = sql
      .exec<{ bytes: number; sequence: number }>(
        'SELECT COALESCE(SUM(bytes), 0) AS bytes, COALESCE(MAX(used), 0) AS sequence FROM public_render_cache',
      )
      .one();
    this.bytes = totals.bytes;
    this.sequence = totals.sequence;
  }

  retain(prefix: string) {
    if (this.prefix === prefix) return;
    const retired = this.sql
      .exec<{ bytes: number }>(
        'DELETE FROM public_render_cache WHERE substr(key, 1, ?) <> ? RETURNING bytes',
        prefix.length,
        prefix,
      )
      .toArray();
    this.bytes -= retired.reduce((bytes, row) => bytes + row.bytes, 0);
    this.prefix = prefix;
  }

  get(key: string): Page | undefined {
    const row = this.sql
      .exec<Row>('SELECT body, headers, status FROM public_render_cache WHERE key = ?', key)
      .toArray()[0];
    if (!row) return undefined;
    this.sql.exec('UPDATE public_render_cache SET used = ? WHERE key = ?', ++this.sequence, key);
    return { body: row.body, status: row.status, headers: JSON.parse(row.headers) };
  }

  put(key: string, page: Page) {
    // An old render can finish after publication has retired its identity.
    if (this.prefix !== undefined && !key.startsWith(this.prefix)) return;
    const headers = JSON.stringify(page.headers);
    const bytes = new TextEncoder().encode(key + page.body + headers).byteLength;
    if (bytes > Math.min(this.maxBytes, publicRenderPageBytes)) return;
    const previous = this.sql
      .exec<{ bytes: number }>('SELECT bytes FROM public_render_cache WHERE key = ?', key)
      .toArray()[0];
    if (previous) {
      this.sql.exec('DELETE FROM public_render_cache WHERE key = ?', key);
      this.bytes -= previous.bytes;
    }
    // Evict before writing: storage exhaustion must not leave the persisted table over its byte budget.
    while (this.bytes + bytes > this.maxBytes) {
      const oldest = this.sql
        .exec<{ key: string; bytes: number }>('SELECT key, bytes FROM public_render_cache ORDER BY used LIMIT 1')
        .one();
      this.sql.exec('DELETE FROM public_render_cache WHERE key = ?', oldest.key);
      this.bytes -= oldest.bytes;
    }
    this.sql.exec(
      `INSERT OR REPLACE INTO public_render_cache (key, body, headers, status, bytes, used)
      VALUES (?, ?, ?, ?, ?, ?)`,
      key,
      page.body,
      headers,
      page.status,
      bytes,
      ++this.sequence,
    );
    this.bytes += bytes;
  }
}

export async function publicPageEtag(key: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key));
  return `W/"${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}"`;
}

export function publicPageNotModified(request: Request, etag: string) {
  return (request.headers.get('If-None-Match') ?? '').split(',').some((value) => {
    const tag = value.trim();
    return tag === '*' || tag.replace(/^W\//, '') === etag.replace(/^W\//, '');
  });
}

export function publicCachedPageResponse(request: Request, page: Page) {
  const etag = new Headers(page.headers).get('ETag');
  const notModified = etag !== null && publicPageNotModified(request, etag);
  return new Response(notModified || request.method === 'HEAD' ? null : page.body, {
    status: notModified ? 304 : page.status,
    headers: page.headers,
  });
}
