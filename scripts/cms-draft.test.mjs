import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateCmsDraft, validateCmsContent } from '../packages/content-model/src/emdash-content.ts';

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
