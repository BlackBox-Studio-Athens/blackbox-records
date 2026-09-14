import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';

// Read-only hosted check. Supply a known imported original, not a nonexistent ID.
const { values } = parseArgs({ options: { original: { type: 'string' } } });
assert.match(values.original ?? '', /^[A-Z0-9]{26}\.(?:png|jpe?g|webp|gif|avif)$/i);
const paths = [
  '/_emdash/api/media',
  `/_emdash/api/media/file/${values.original}`,
  '/_emdash/api/content/news?status=draft',
  '/_emdash/api/media/file/drafts/probe.png',
  '/_emdash/api/media/file/snapshots/probe.json',
  '/_emdash/api/media/file/backups/probe.sql',
  '/_emdash/api/media/file/%2e%2e%2fbackups%2fprobe.sql',
  '/media/backups/probe.sql',
  '/drafts/probe/',
  '/snapshots/probe.json',
  '/backups/probe.sql',
];
const targets = [
  { origin: 'https://staff-uat.blackboxrecordsathens.com', status: 302 },
  { origin: 'https://blackbox-records-backend-uat.blackboxrecordsathens.workers.dev', status: 403 },
  { origin: 'https://blackbox-records-web-uat.pages.dev', status: 404 },
];
for (const { origin, status } of targets) {
  for (const path of paths) {
    for (const method of ['GET', 'HEAD']) {
      const response = await fetch(origin + path, {
        method,
        redirect: 'manual',
        signal: AbortSignal.timeout(15_000),
      });
      try {
        assert.equal(response.status, status, `${method} ${origin}${path}`);
        assert.match(response.headers.get('cache-control') ?? '', /\bno-store\b/);
        if (status === 302) {
          const location = new URL(response.headers.get('location'));
          assert.equal(location.origin, 'https://blackboxrecords.cloudflareaccess.com');
          assert.ok(location.pathname.startsWith('/cdn-cgi/access/login/'));
        }
        // Do not log redirect parameters, bodies, cookies, or authorization data.
        console.log(JSON.stringify({ origin, path, method, status: response.status }));
      } finally {
        await response.body?.cancel();
      }
    }
  }
}
console.log(`UAT media privacy passed: ${targets.length * paths.length * 2} anonymous GET/HEAD checks.`);
