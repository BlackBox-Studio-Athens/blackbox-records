import { afterEach, expect, test, vi } from 'vitest';
import { BandcampPage } from '@blackbox/content-model';
import { bandcampResolutionPath, handleBandcampResolution, resolveBandcampPage } from './bandcamp-resolution';

const ethos = 'https://mistyroute.bandcamp.com/album/ethos';
const hail = 'https://mistyroute.bandcamp.com/track/hail';
const headers = { Origin: 'https://staff.example', 'X-EmDash-Request': '1', 'Content-Type': 'application/json' };
const post = (url = ethos, customHeaders: HeadersInit = headers, extra = {}) =>
  new Request('https://staff.example' + bandcampResolutionPath, {
    method: 'POST',
    headers: customHeaders,
    body: JSON.stringify({ url, ...extra }),
  });
const htmlResponse = (html: string) => new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
// Minimal public metadata captured from Ethos and Hail on 12 October 2026.
const metadata = (
  kind = 'album',
  id = 2345223781,
) => `<meta property="og:video:secure_url" content="https://bandcamp.com/EmbeddedPlayer/v=2/${kind}=${id}/size=large/tracklist=false/artwork=small/">
<script data-tralbum="${JSON.stringify({ id, item_type: kind, current: { id, type: kind, ...(kind === 'track' ? { album_id: 2345223781 } : {}) } }).replaceAll('"', '&quot;')}"></script>`;
const page = (url = ethos) => BandcampPage.parse(url)!;
afterEach(() => vi.useRealTimers());

test('resolves Ethos and Hail from agreeing metadata without forwarding staff credentials', async () => {
  for (const [url, kind, id] of [
    [ethos, 'album', 2345223781],
    [hail, 'track', 1718987398],
  ] as const) {
    const fetchPage = vi.fn<typeof fetch>().mockResolvedValue(htmlResponse(metadata(kind, id)));
    const response = await handleBandcampResolution(
      post(url, { ...headers, Cookie: 'private', Authorization: 'secret' }),
      { role: 30 },
      fetchPage,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ success: true, data: { kind, id: String(id) } });
    expect(fetchPage).toHaveBeenCalledExactlyOnceWith(
      url,
      expect.objectContaining({ redirect: 'manual', headers: { Accept: 'text/html' } }),
    );
  }
});

test('falls back to structured metadata and supports numeric HTML entities', async () => {
  const structured = metadata()
    .replace(/<meta[^>]+>/, '')
    .replaceAll('&quot;', '&#34;');
  const result = await resolveBandcampPage(page(), vi.fn<typeof fetch>().mockResolvedValue(htmlResponse(structured)));
  expect(result.toJSON()).toEqual({ kind: 'album', id: '2345223781' });
});

test.each([
  '',
  '<script>var album_id = 2345223781;</script>',
  metadata().replace('album=2345223781', 'album=123'),
  metadata('track', 1718987398),
  metadata().replace('&quot;id&quot;:2345223781', '&quot;id&quot;:0'),
  metadata() + '<meta property="og:video" content="https://bandcamp.com/EmbeddedPlayer/album=123/">',
])('rejects missing, conflicting or wrong-kind metadata (%#)', async (html) => {
  // Invalid structured metadata alone is ignored, so remove the valid advertised player in that case.
  if (html.includes('&quot;id&quot;:0')) html = html.replace(/<meta[^>]+>/, '');
  await expect(
    resolveBandcampPage(page(), vi.fn<typeof fetch>().mockResolvedValue(htmlResponse(html))),
  ).rejects.toThrow();
});

test('enforces authorization, same-origin JSON and request bounds before external I/O', async () => {
  const fetchPage = vi.fn<typeof fetch>();
  for (const identity of [null, { role: 10 }])
    expect((await handleBandcampResolution(post(), identity, fetchPage)).status).toBe(403);
  for (const badHeaders of [
    { ...headers, Origin: 'https://evil.example' },
    { ...headers, 'X-EmDash-Request': '' },
  ])
    expect((await handleBandcampResolution(post(ethos, badHeaders), { role: 30 }, fetchPage)).status).toBe(403);
  for (const request of [
    post('https://127.0.0.1/album/ethos'),
    post(ethos, headers, { extra: true }),
    post('a'.repeat(5000)),
    post(ethos, { ...headers, 'Content-Type': 'text/plain' }),
  ])
    expect((await handleBandcampResolution(request, { role: 30 }, fetchPage)).status).toBe(400);
  expect(fetchPage).not.toHaveBeenCalled();
});

test('allows bounded recording redirects but rejects escapes, loops and a fourth redirect', async () => {
  const redirected = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 302, headers: { Location: '/album/ethos-2?ref=share' } }))
    .mockResolvedValueOnce(htmlResponse(metadata()));
  expect((await resolveBandcampPage(page(), redirected)).id).toBe('2345223781');
  expect(redirected.mock.calls[1]?.[0]).toBe('https://mistyroute.bandcamp.com/album/ethos-2');
  for (const destination of [
    'http://mistyroute.bandcamp.com/album/ethos',
    'https://127.0.0.1/album/a',
    'https://mistyroute.bandcamp.com/track/hail',
    ethos,
  ]) {
    const fetchPage = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 302, headers: { Location: destination } }));
    await expect(resolveBandcampPage(page(), fetchPage)).rejects.toThrow();
    expect(fetchPage).toHaveBeenCalledTimes(1);
  }
  let n = 0;
  const endless = vi
    .fn<typeof fetch>()
    .mockImplementation(
      async () => new Response(null, { status: 302, headers: { Location: '/album/redirect-' + ++n } }),
    );
  await expect(resolveBandcampPage(page(), endless)).rejects.toThrow('too many');
  expect(endless).toHaveBeenCalledTimes(4);
});

test('rejects upstream errors, non-HTML and oversized decoded bodies', async () => {
  for (const response of [
    new Response('blocked', { status: 429 }),
    Response.json({}),
    htmlResponse(' '.repeat(2 * 1024 * 1024 + 1)),
  ]) {
    const result = await handleBandcampResolution(
      post(),
      { role: 30 },
      vi.fn<typeof fetch>().mockResolvedValue(response),
    );
    expect(result.status).toBe(422);
    expect(result.headers.get('Cache-Control')).toBe('private, no-store');
  }
});

test('one deadline aborts stalled lookup instead of leaving the field pending', async () => {
  vi.useFakeTimers();
  let signal: AbortSignal | undefined;
  const fetchPage = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
    signal = init?.signal ?? undefined;
    return new Promise(() => {});
  });
  const result = resolveBandcampPage(page(), fetchPage);
  const assertion = expect(result).rejects.toThrow('timed out');
  await vi.advanceTimersByTimeAsync(10_000);
  await assertion;
  expect(signal?.aborted).toBe(true);
});
