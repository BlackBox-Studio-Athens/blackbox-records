// Real browser regression for the meta-CSP/srcdoc boundary, not a policy string snapshot.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { chromium, firefox } from 'playwright';
import { previewPolicy } from '../apps/backend/src/cms/preview-policy.ts';

const image = await readFile('apps/staff/public/favicon-96x96.png');
const hits = [];
const server = createServer((request, response) => {
  hits.push(request.url);
  if (request.url === '/style.css') {
    response.setHeader('Content-Type', 'text/css');
    response.end('body { background-color: rgb(12, 34, 56); }');
  } else if (request.url === '/image.png') {
    response.setHeader('Content-Type', 'image/png');
    response.end(image);
  } else {
    response.setHeader('Content-Type', 'text/html');
    response.end('<!doctype html><title>Preview security</title><iframe sandbox="allow-same-origin"></iframe>');
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
      await page.evaluate(
        ({ policy }) => {
          document.querySelector('iframe').srcdoc =
            `<html><head><meta http-equiv="Content-Security-Policy" content="${policy}"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="https://untrusted.invalid/style.css"></head><body><img src="/image.png"><img src="https://untrusted.invalid/private.png"><script>parent.previewScriptRan=true</script><script src="/forbidden.js"></script><form action="/submitted" method="post"><button>Submit</button></form></body></html>`;
        },
        { policy: previewPolicy(origin) },
      );
      await page.waitForFunction(() => {
        const doc = document.querySelector('iframe').contentDocument;
        return doc?.images[0]?.complete && doc.images[0].naturalWidth > 0 && doc.querySelector('link')?.sheet;
      });
      const frame = page.frames()[1];
      assert.equal(await frame.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(12, 34, 56)');
      await frame.getByRole('button', { name: 'Submit' }).click();
      await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => !!window.previewScriptRan), false);
      assert.equal(forbidden.length, 0);
      assert.ok(!hits.includes('/submitted') && !hits.includes('/forbidden.js'));
      console.log(`${browserType.name()}: CSS/image allowed; external assets, scripts and forms blocked`);
    } finally {
      await browser.close();
    }
  }
} finally {
  server.close();
}
