import { afterAll, afterEach, beforeAll } from 'vitest';

import { webMswServer } from './msw-server';

beforeAll(() => {
  webMswServer.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  webMswServer.resetHandlers();
});

afterAll(() => {
  webMswServer.close();
});
