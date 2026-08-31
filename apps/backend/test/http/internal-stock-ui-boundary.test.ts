import { describe, expect, it } from 'vitest';

import { createHttpApp } from '../../src/interfaces/http/app';

describe('internal stock UI boundary', () => {
  it('does not serve the stock operations UI from the Worker', async () => {
    const app = createHttpApp();

    for (const path of ['/stock/', '/stock/variant_disintegration-black-vinyl-lp_standard/']) {
      const response = await app.request(`http://backend.test${path}`);

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        code: 'not_found',
        error: 'Not Found',
      });
    }
  });
});
