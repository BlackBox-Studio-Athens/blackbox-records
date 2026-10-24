import { afterAll, afterEach, beforeAll } from 'vitest';

import { webMswServer } from './msw-server';

beforeAll(() => {
  webMswServer.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  webMswServer.resetHandlers();
});

afterAll(() => {
  webMswServer.close();
});
