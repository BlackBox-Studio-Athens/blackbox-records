import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCmsDraft, validateCmsContent } from '../packages/content-model/src/emdash-content.ts';
import { onRequest, nativeEditorialWrite } from '../apps/backend/src/middleware.ts';

test('release create and save translate the editorial artist field into native references', async () => {
  for (const method of ['POST', 'PUT']) {
    for (const artist of ['artist-one', '', null, undefined]) {
      const url = new URL('http://localhost/_emdash/api/content/releases' + (method === 'PUT' ? '/lotus' : ''));
      const data = { title: 'LOTUS', ...(artist === undefined ? {} : { artist }) };
      const body = { ...(method === 'PUT' ? { _rev: 'revision-one' } : { slug: 'lotus' }), data };
      const request = new Request(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nativeEditorialWrite('releases', body)),
      });
      let forwarded;
      const response = await onRequest({ request, url }, async (rewritten) => {
        forwarded = await (rewritten ?? request).json();
        return new Response(null, { status: 204 });
      });
      assert.equal(response.status, 204);
      assert.deepEqual(
        forwarded,
        artist === undefined
          ? body
          : {
              ...body,
              data: { title: 'LOTUS' },
              references: { artist: artist ? [artist] : [] },
            },
      );
    }
  }
});

test('editorial reference writes reject other relations, multiple artists and mixed payloads', async () => {
  for (const fields of [
    { references: { other: ['artist-one'] } },
    { references: { artist: ['one', 'two'] } },
    { references: { artist: [42] } },
    { references: null },
    { data: { artist: 'one' }, references: { artist: ['two'] } },
  ]) {
    const url = new URL('http://localhost/_emdash/api/content/releases');
    const request = new Request(url, {
      method: 'POST',
      body: JSON.stringify({ slug: 'lotus', data: { title: 'LOTUS' }, ...fields }),
    });
    const response = await onRequest({ request, url }, () => assert.fail('Unsupported fields must be rejected'));
    assert.equal(response.status, 400);
  }
});

test('unfinished drafts remain private and cannot pass publication validation', () => {
  assert.deepEqual(validateCmsDraft('artists', { title: 'New artist', image: null, bio: '' }), []);
  assert.ok(validateCmsContent('artists', { title: 'New artist', image: null, bio: '' }).length);
  assert.deepEqual(
    validateCmsDraft('services', { process: { steps: [{ title: 'Discuss', body: 'Talk about the release.' }] } }),
    [],
  );
  assert.deepEqual(validateCmsDraft('home', { hero: { tagline: 'Work in progress', image: null } }), []);
});
test('draft validation retains trust boundaries', () => {
  assert.ok(validateCmsDraft('artists', { surprise: true }).length);
  assert.ok(validateCmsDraft('artists', { title: 2 }).length);
  assert.ok(validateCmsDraft('home', { hero: { unknown: 'field' } }).length);
  assert.ok(validateCmsDraft('artists', { body: [{ _type: 'html', html: '<script>alert(1)</script>' }] }).length);
  assert.ok(validateCmsDraft('socials', { title: 'Link', url: 'javascript:alert(1)' }).length);
});
