import { expect, test } from 'vitest';
import { staffAssetResponse } from '../../src/cms/staff-assets';

test('only successful hashed assets with validators permit private mandatory revalidation', () => {
  const respond = (path: string, status = 200, headers: Record<string, string> = {}, method = 'GET') =>
    staffAssetResponse(
      new Request(`https://staff.invalid${path}`, { method }),
      new Response(null, {
        status,
        headers: { 'Content-Type': 'text/javascript', ETag: '"asset"', ...headers },
      }),
    );
  for (const method of ['GET', 'HEAD']) {
    for (const status of [200, 304]) {
      const response = respond('/_astro/app.1234abcd.js', status, {}, method);
      expect(response.headers.get('Cache-Control')).toBe('private, no-cache, must-revalidate');
      expect(response.headers.get('ETag')).toBe('"asset"');
    }
  }
  for (const response of [
    respond('/'),
    respond('/_astro/app.js'),
    respond('/_astro/app.1234abcd.js?user=1'),
    respond('/_astro/app.1234abcd.js', 403),
    respond('/_astro/app.1234abcd.js', 500),
    respond('/_astro/app.1234abcd.js', 200, { 'Set-Cookie': 'session=secret' }),
    respond('/_astro/app.1234abcd.js', 200, { 'Content-Type': 'text/html' }),
    respond('/_astro/app.1234abcd.js', 200, {}, 'POST'),
    staffAssetResponse(new Request('https://staff.invalid/_astro/app.1234abcd.js'), new Response('code')),
  ])
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
});
