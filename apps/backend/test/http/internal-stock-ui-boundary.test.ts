import { describe, expect, it } from 'vitest';

import { CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER } from '../../src/interfaces/http/auth';
import { createHttpApp } from '../../src/interfaces/http/app';

describe('internal stock UI boundary', () => {
  it('does not serve the stock operations UI from the Worker', async () => {
    const app = createHttpApp();

    for (const path of ['/stock/', '/stock/variant_barren-point_standard/']) {
      const response = await app.request(`http://backend.test${path}`, {
        headers: {
          [CF_ACCESS_AUTHENTICATED_USER_EMAIL_HEADER]: 'operator@blackboxrecords.example',
        },
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: 'Not Found',
      });
    }
  });
});
