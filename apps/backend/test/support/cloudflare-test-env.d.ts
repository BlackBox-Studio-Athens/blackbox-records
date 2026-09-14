import type { D1Migration } from 'cloudflare:test';
import type { AppBindings } from '../../src/env';

declare global {
  namespace Cloudflare {
    interface Env extends AppBindings {
      TEST_MIGRATIONS: D1Migration[];
      TEST_SNAPSHOTS: R2Bucket;
      TEST_CMS_DB: D1Database;
      TEST_CMS_MIGRATIONS: D1Migration[];
    }
  }
}
