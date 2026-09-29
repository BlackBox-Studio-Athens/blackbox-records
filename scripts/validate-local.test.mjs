import assert from 'node:assert/strict';
import { test } from 'node:test';
import { main as validateMain } from './validate.mjs';
import { main as localMain } from './validate-local.mjs';

test('legacy validation launcher delegates to the Nx wrapper entrypoint', () => {
  assert.equal(localMain, validateMain);
});
